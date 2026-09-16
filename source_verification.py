#!/usr/bin/env python3
"""Discover and verify real property availability sources.

This is deliberately separate from vacancy extraction. A homepage is not a live
availability source, and a floor-plan page is not proof of a currently available
unit. The script follows same-domain links from each official property URL and
records the exact pages that appear to expose availability, floor plans, leasing,
or application information.
"""

import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

PROPERTIES = Path("properties_scoped.json")
SOURCE_MAP = Path("source_verification.json")
TIMEOUT = 20
MAX_PAGES = 12
DELAY = 0.8
UA = "DecodedJustice-HousingTracker-SourceVerifier/1.0"

STATUS = {"VERIFIED", "UNVERIFIED", "NOT_FOUND", "BROKEN", "REDIRECTED", "SOURCE_CHANGED", "MANUAL_REVIEW"}

LINK_CLASSES = {
    "live_availability_url": ["availability", "available", "apartments", "units", "rentals", "homes"],
    "floor_plans_url": ["floor plan", "floorplan", "floor-plan", "floorplans"],
    "leasing_url": ["leasing", "pricing", "rent", "rates"],
    "application_url": ["apply", "application", "lease application"],
}


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip()


def load(path, default):
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def classify_link(text, href):
    target = f"{text} {href}".lower()
    scores = {key: sum(1 for token in tokens if token in target) for key, tokens in LINK_CLASSES.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] else None


def availability_signal(text):
    t = text.lower()
    positive = [
        r"available now", r"available units?", r"check availability", r"view availability",
        r"see available", r"now leasing", r"move[- ]?in", r"select a unit", r"choose a unit",
        r"lease this apartment", r"available homes?", r"apartments? available",
    ]
    negative = [r"no availability", r"no units? available", r"fully occupied", r"join the waitlist", r"wait list"]
    return any(re.search(p, t) for p in positive), any(re.search(p, t) for p in negative)


def inspect(session, url):
    try:
        r = session.get(url, timeout=TIMEOUT, headers={"User-Agent": UA}, allow_redirects=True)
        final = r.url
        if r.status_code >= 400:
            return {"url": url, "final_url": final, "status": "BROKEN", "http_status": r.status_code, "links": [], "live": False, "waitlist": False}
        soup = BeautifulSoup(r.text, "lxml")
        text = norm(soup.get_text(" ", strip=True))
        links = []
        for a in soup.find_all("a", href=True):
            href = urljoin(final, a.get("href"))
            if not href.startswith(("http://", "https://")):
                continue
            label = norm(a.get_text(" ", strip=True))
            kind = classify_link(label, href)
            if kind:
                links.append({"kind": kind, "url": href, "label": label})
        live, waitlist = availability_signal(text)
        return {
            "url": url,
            "final_url": final,
            "status": "REDIRECTED" if final.rstrip("/") != url.rstrip("/") else "VERIFIED",
            "http_status": r.status_code,
            "content_length": len(r.text),
            "live": live,
            "waitlist": waitlist,
            "links": links,
        }
    except Exception as exc:
        return {"url": url, "final_url": None, "status": "BROKEN", "http_status": None, "links": [], "live": False, "waitlist": False, "error": str(exc)}


def main():
    properties = load(PROPERTIES, [])
    source_map = []
    session = requests.Session()
    for item in properties:
        name, city = item.get("name"), item.get("city")
        root = item.get("url")
        record = {
            "property_name": name,
            "city": city,
            "property_url": root,
            "official_website_url": root,
            "live_availability_url": None,
            "floor_plans_url": None,
            "leasing_url": None,
            "application_url": None,
            "source_type": None,
            "source_status": "UNVERIFIED",
            "live_availability_verified": False,
            "waitlist_only": False,
            "last_tested_at": datetime.now(timezone.utc).isoformat(),
            "tested_pages": [],
            "notes": [],
        }
        if not root:
            record["source_status"] = "NOT_FOUND"
            record["notes"].append("No official property URL supplied.")
            source_map.append(record)
            continue
        queue = [root]
        seen = set()
        root_host = urlparse(root).netloc
        while queue and len(seen) < MAX_PAGES:
            url = queue.pop(0)
            if url in seen or urlparse(url).netloc != root_host:
                continue
            seen.add(url)
            result = inspect(session, url)
            record["tested_pages"].append(result)
            if result.get("status") == "BROKEN":
                time.sleep(DELAY)
                continue
            if result.get("status") == "REDIRECTED" and not record.get("official_website_url"):
                record["official_website_url"] = result.get("final_url")
            for link in result.get("links", []):
                kind, href = link["kind"], link["url"]
                if kind == "live_availability_url" and not record["live_availability_url"]:
                    record["live_availability_url"] = href
                elif kind == "floor_plans_url" and not record["floor_plans_url"]:
                    record["floor_plans_url"] = href
                elif kind == "leasing_url" and not record["leasing_url"]:
                    record["leasing_url"] = href
                elif kind == "application_url" and not record["application_url"]:
                    record["application_url"] = href
                if href not in seen and len(seen) + len(queue) < MAX_PAGES:
                    queue.append(href)
            if result.get("live"):
                record["live_availability_verified"] = True
                record["source_type"] = "official_property_site"
            if result.get("waitlist"):
                record["waitlist_only"] = True
            time.sleep(DELAY)
        if record["live_availability_verified"]:
            record["source_status"] = "VERIFIED"
        elif record["live_availability_url"] or record["floor_plans_url"] or record["leasing_url"]:
            record["source_status"] = "MANUAL_REVIEW"
            record["notes"].append("Relevant source page found, but live unit availability was not conclusively verified from the crawl.")
        elif any(p.get("status") == "VERIFIED" for p in record["tested_pages"]):
            record["source_status"] = "UNVERIFIED"
            record["notes"].append("Official site reachable but no relevant availability/leasing page was identified automatically.")
        else:
            record["source_status"] = "BROKEN"
        # Feed discovered URLs back into the scanner without replacing the canonical inventory.
        item.update({k: record[k] for k in ("official_website_url", "live_availability_url", "floor_plans_url", "leasing_url", "application_url") if record[k]})
        source_map.append(record)
    PROPERTIES.write_text(json.dumps(properties, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    SOURCE_MAP.write_text(json.dumps(source_map, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    counts = {}
    for r in source_map:
        counts[r["source_status"]] = counts.get(r["source_status"], 0) + 1
    print(json.dumps({"properties_processed": len(source_map), "source_status_counts": counts, "live_availability_verified": sum(1 for r in source_map if r["live_availability_verified"])}, indent=2))


if __name__ == "__main__":
    main()

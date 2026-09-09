#!/usr/bin/env python3
"""Collect secondary public-marketplace leads without treating them as proof.

This module deliberately uses search-engine result pages rather than attempting to
bypass marketplace controls. Results are stored as LEADS and require verification
against the property's official site or leasing office before being shown as confirmed.
"""
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlparse

import requests
from bs4 import BeautifulSoup

CONFIG = Path("external_sources.json")
OUT = Path("external_leads.json")
CITIES = ["Redmond", "Bellevue", "Bothell", "Kirkland", "Woodinville"]
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ARCH-MFTE-Housing-Tracker/2.1)"}

# Public search endpoints. We do not crawl login-gated pages or attempt to defeat
# robots, CAPTCHAs, rate limits, or other access controls.
SEARCH_URLS = {
    "Craigslist": "https://www.google.com/search?q=site%3Aseattle.craigslist.org+{query}",
    "Zumper": "https://www.google.com/search?q=site%3Azumper.com+{query}",
    "Apartments.com": "https://www.google.com/search?q=site%3Aapartments.com+{query}",
    "Apartment Finder": "https://www.google.com/search?q=site%3Aapartmentfinder.com+{query}",
}

KEYWORDS = ["mfte", "arch", "income restricted", "affordable", "moderate income"]

def load_config():
    try:
        return json.loads(CONFIG.read_text(encoding="utf-8"))
    except Exception:
        return {"sources": []}

def normalize(s):
    return re.sub(r"\s+", " ", s or "").strip()

def search(session, source, city, term):
    q = quote(f'"{city}" {term} apartment')
    url = SEARCH_URLS[source].format(query=q)
    r = session.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    leads = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        text = normalize(a.get_text(" ", strip=True))
        if not text or not href.startswith("http"):
            continue
        parsed = urlparse(href)
        if source == "Craigslist" and "craigslist.org" not in parsed.netloc:
            continue
        if source == "Zumper" and "zumper.com" not in parsed.netloc:
            continue
        if source == "Apartments.com" and "apartments.com" not in parsed.netloc:
            continue
        if source == "Apartment Finder" and "apartmentfinder.com" not in parsed.netloc:
            continue
        leads.append({
            "source": source,
            "city": city,
            "query_term": term,
            "title": text[:240],
            "listing_url": href,
            "status": "new",
            "verification_required": True,
            "captured_at": datetime.now(timezone.utc).isoformat(),
        })
        if len(leads) >= 10:
            break
    return leads

def main():
    cfg = load_config()
    enabled = {x["name"] for x in cfg.get("sources", []) if x.get("enabled") and x.get("type") == "search"}
    session = requests.Session()
    results = []
    seen = set()
    for source in ["Craigslist", "Zumper", "Apartments.com", "Apartment Finder"]:
        if source not in enabled:
            continue
        for city in CITIES:
            for term in KEYWORDS:
                try:
                    for lead in search(session, source, city, term):
                        key = lead["listing_url"]
                        if key not in seen:
                            seen.add(key)
                            results.append(lead)
                except Exception as exc:
                    results.append({"source": source, "city": city, "query_term": term,
                                    "status": "error", "error": str(exc)[:300],
                                    "captured_at": datetime.now(timezone.utc).isoformat()})
                time.sleep(1)
    payload = {"generated_at": datetime.now(timezone.utc).isoformat(),
               "lead_count": len(results), "leads": results}
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

if __name__ == "__main__":
    main()

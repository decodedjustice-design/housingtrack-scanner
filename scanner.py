#!/usr/bin/env python3
"""
ARCH + MFTE Housing Availability Scanner

Purpose:
- Poll official property availability/floor-plan pages every 2 hours via GitHub Actions.
- Follow relevant availability/floor-plan/leasing links found on property sites.
- Extract availability, bedroom, sqft and rent signals when present.
- Preserve evidence URLs and timestamps so the dashboard can show what was checked.
- Support eligibility metadata so HA-owned, senior-only, disability-only and
  100%-low-income properties can be excluded without deleting them from the master inventory.

Important: a keyword match is a LEAD, not proof that an affordable unit is currently
available. The dashboard should display the source URL and last-checked timestamp and
require verification with the property before an applicant relies on it.
"""

import json
import os
import re
import smtplib
import time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

RESULTS_FILE = Path("availability_results.json")
HISTORY_FILE = Path("scan_history.json")
PROPERTIES_FILE = Path("properties_scoped.json")
ALERT_EMAIL = "DecodedJustice@gmail.com"
TARGET_CITIES = {"Redmond", "Bellevue", "Bothell", "Kirkland", "Woodinville"}
MAX_RENT_NO_UTILITIES = 2662
MAX_RENT_WITH_UTILITIES = 2772
REQUEST_TIMEOUT = 20
MAX_PAGES_PER_PROPERTY = 5
POLITE_DELAY_SECONDS = 1.0

AVAILABLE_PATTERNS = [
    r"available\s+now", r"move[- ]?in\s+(today|ready|now)", r"immediate\s+availability",
    r"units?\s+available", r"apply\s+now", r"schedule\s+a\s+tour", r"check\s+availability",
    r"view\s+available", r"see\s+available", r"available\s+units?", r"now\s+leasing",
    r"leasing\s+now", r"open\s+for\s+leasing", r"vacanc(?:y|ies)", r"floor\s*plan\s+available",
    r"\b\d+\s+(?:unit|units)\s+available\b",
]
WAITLIST_PATTERNS = [r"join\s+(?:the\s+)?wait\s*list", r"fully\s+occupied", r"no\s+units?\s+available", r"no\s+availability", r"not\s+currently\s+accepting"]
DEN_PATTERNS = [r"\bden\b", r"\+\s*den\b", r"w/\s*den\b", r"loft", r"home\s+office", r"bonus\s+room", r"flex\s+(?:room|space)", r"attached\s+garage", r"townhome", r"townhouse"]
BEDROOM_PATTERNS = {
    "studio": [r"studio"], "1br": [r"\b1\s*(?:br|bed|bedroom)\b", r"one[- ]bedroom"],
    "2br": [r"\b2\s*(?:br|bed|bedroom)\b", r"two[- ]bedroom"], "3br": [r"\b3\s*(?:br|bed|bedroom)\b", r"three[- ]bedroom"],
    "4br": [r"\b4\s*(?:br|bed|bedroom)\b", r"four[- ]bedroom"],
}
PROGRAM_TERMS = {
    "arch": r"\barch\b|a regional coalition for housing", "mfte": r"\bmfte\b|multifamily tax exemption",
    "inclusionary": r"inclusionary|affordable unit|rent[- ]restricted|income[- ]restricted", "moderate_income": r"moderate[- ]income",
}


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_results(value):
    """Accept both the current list format and the legacy {results:{...}} format."""
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        nested = value.get("results")
        if isinstance(nested, dict):
            return list(nested.values())
        if isinstance(nested, list):
            return nested
    return []


def normalize_space(value):
    return re.sub(r"\s+", " ", value or "").strip()


def extract_numbers(pattern, text):
    values = []
    for match in re.finditer(pattern, text, flags=re.I):
        try:
            values.append(float(match.group(1).replace(",", "")))
        except (ValueError, AttributeError):
            pass
    return values


def extract_signals(text):
    lowered = text.lower()
    available = [p for p in AVAILABLE_PATTERNS if re.search(p, lowered)]
    waitlist = [p for p in WAITLIST_PATTERNS if re.search(p, lowered)]
    bedrooms = [name for name, patterns in BEDROOM_PATTERNS.items() if any(re.search(p, lowered) for p in patterns)]
    rents = extract_numbers(r"\$\s*([0-9][0-9,]{2,5})(?:\s*(?:/|per)\s*month|\s*monthly)?", text)
    sqft = extract_numbers(r"([0-9]{3,4})\s*(?:sq\.?\s*ft\.?|square\s+feet)", text)
    den_features = sorted({p.strip("\\b") for p in DEN_PATTERNS if re.search(p, lowered)})
    programs = [name for name, pattern in PROGRAM_TERMS.items() if re.search(pattern, lowered)]
    return {"availability_signals": available, "waitlist_signals": waitlist, "bedroom_types": bedrooms, "rents": rents, "sqft": sqft, "features": den_features, "program_signals": programs}


def eligibility(property_record):
    if property_record.get("ha_owned"):
        return "excluded", "HA-owned/managed"
    if property_record.get("senior_only"):
        return "excluded", "senior/age-restricted"
    if property_record.get("disability_only"):
        return "excluded", "disability-only"
    if property_record.get("low_income_only"):
        return "excluded", "100%-low-income-only"
    if property_record.get("exclude_reason"):
        return "excluded", property_record["exclude_reason"]
    programs = {str(x).lower() for x in property_record.get("programs", [])}
    if programs.intersection({"arch", "mfte", "inclusionary", "moderate_income", "moderate-income"}):
        return "included", None
    return "review", None


def classify(record, signals, error=None):
    if error:
        return "error"
    eligibility_status, _ = eligibility(record)
    if eligibility_status == "excluded":
        return "excluded"
    if signals["availability_signals"]:
        return "available"
    if signals["waitlist_signals"]:
        return "waitlist_or_limited"
    return "unknown"


def discover_links(base_url, soup):
    links = []
    keywords = ("availability", "available", "floor", "floorplan", "floor-plan", "apartment", "apartments", "unit", "units", "leasing", "rentals", "pricing", "apply")
    for anchor in soup.find_all("a", href=True):
        href = urljoin(base_url, anchor["href"])
        text = normalize_space(anchor.get_text(" ", strip=True)).lower()
        target = f"{text} {href.lower()}"
        if urlparse(href).netloc != urlparse(base_url).netloc:
            continue
        if any(keyword in target for keyword in keywords):
            links.append(href)
    return list(dict.fromkeys(links))


def fetch_page(session, url):
    response = session.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": "DecodedJustice-HousingTracker/1.0"})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "lxml")
    return response.url, soup, normalize_space(soup.get_text(" ", strip=True))


def scan_property(session, item):
    started = datetime.now(timezone.utc).isoformat()
    eligibility_status, exclude_reason = eligibility(item)
    result = {"name": item.get("name"), "city": item.get("city"), "url": item.get("url"), "eligibility": eligibility_status, "exclude_reason": exclude_reason, "pages_checked": [], "checked_at": started, "status": "excluded" if eligibility_status == "excluded" else "unknown", "details": {}, "error": None}
    if item.get("city") not in TARGET_CITIES:
        result["status"] = "excluded"; result["eligibility"] = "excluded"; result["exclude_reason"] = "outside target five-city scope"; return result
    if eligibility_status == "excluded":
        return result
    urls = [item.get("url")]
    for field in ("availability_url", "floor_plans_url", "leasing_url"):
        if item.get(field): urls.append(item[field])
    all_signals = {"availability_signals": [], "waitlist_signals": [], "bedroom_types": [], "rents": [], "sqft": [], "features": [], "program_signals": []}
    try:
        first_url, soup, _ = fetch_page(session, urls[0])
        urls = list(dict.fromkeys([first_url] + urls[1:] + discover_links(first_url, soup)))[:MAX_PAGES_PER_PROPERTY]
        for url in urls:
            if url in result["pages_checked"]: continue
            try:
                final_url, _, page_text = fetch_page(session, url)
                result["pages_checked"].append(final_url)
                signals = extract_signals(page_text)
                for key in all_signals: all_signals[key].extend(signals[key])
                time.sleep(POLITE_DELAY_SECONDS)
            except Exception as exc:
                result["details"].setdefault("page_errors", []).append({"url": url, "error": str(exc)})
        for key in all_signals: all_signals[key] = sorted(set(all_signals[key]))
        result["details"] = all_signals
        result["min_rent"] = min(all_signals["rents"]) if all_signals["rents"] else None
        result["max_rent"] = max(all_signals["rents"]) if all_signals["rents"] else None
        result["min_sqft"] = min(all_signals["sqft"]) if all_signals["sqft"] else None
        result["max_sqft"] = max(all_signals["sqft"]) if all_signals["sqft"] else None
        result["three_bedroom"] = "3br" in all_signals["bedroom_types"]
        result["den_flex"] = bool(all_signals["features"])
        result["budget_flag"] = bool(result["min_rent"] is not None and result["min_rent"] <= MAX_RENT_NO_UTILITIES)
        result["status"] = classify(item, all_signals)
    except Exception as exc:
        result["status"] = "error"; result["error"] = str(exc)
    return result


def main():
    properties = load_json(PROPERTIES_FILE)
    previous = normalize_results(load_json(RESULTS_FILE)) if RESULTS_FILE.exists() else []
    previous_by_key = {(p.get("city"), p.get("name")): p for p in previous if isinstance(p, dict)}
    session = requests.Session()
    results = []
    changes = []
    for item in properties:
        result = scan_property(session, item)
        key = (result.get("city"), result.get("name"))
        old = previous_by_key.get(key)
        if old and old.get("status") != result.get("status"):
            changes.append({"property": result.get("name"), "city": result.get("city"), "from": old.get("status"), "to": result.get("status")})
        results.append(result)
    save_json(RESULTS_FILE, results)
    history = normalize_results(load_json(HISTORY_FILE)) if HISTORY_FILE.exists() else []
    history.append({"checked_at": datetime.now(timezone.utc).isoformat(), "properties": len(results), "changes": changes})
    save_json(HISTORY_FILE, history[-100:])
    print(json.dumps({"properties_scanned": len(results), "changes": changes}, indent=2))


if __name__ == "__main__":
    main()

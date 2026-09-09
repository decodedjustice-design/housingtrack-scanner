#!/usr/bin/env python3
"""
ARCH + MFTE Housing Availability Scanner

Purpose:
- Poll official property availability/floor-plan pages every 2 hours via GitHub Actions.
- Follow relevant availability/floor-plan/leasing links found on property sites.
- Extract availability, bedroom, sqft and rent signals when present.
- Preserve evidence URLs and timestamps so the dashboard can show what was checked.
- Support eligibility metadata so HA-owned, senior-only, disability-only and
  low-income-only properties can be excluded without deleting them from the master inventory.

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
PROPERTIES_FILE = Path("properties.json")
ALERT_EMAIL = "DecodedJustice@gmail.com"

TARGET_CITIES = {"Redmond", "Bellevue", "Bothell", "Kirkland", "Woodinville"}
MAX_RENT_NO_UTILITIES = 2662
MAX_RENT_WITH_UTILITIES = 2772
REQUEST_TIMEOUT = 20
MAX_PAGES_PER_PROPERTY = 5
POLITE_DELAY_SECONDS = 1.0

AVAILABLE_PATTERNS = [
    r"available\s+now",
    r"move[- ]?in\s+(today|ready|now)",
    r"immediate\s+availability",
    r"units?\s+available",
    r"apply\s+now",
    r"schedule\s+a\s+tour",
    r"check\s+availability",
    r"view\s+available",
    r"see\s+available",
    r"available\s+units?",
    r"now\s+leasing",
    r"leasing\s+now",
    r"open\s+for\s+leasing",
    r"vacanc(?:y|ies)",
    r"floor\s*plan\s+available",
    r"\b\d+\s+(?:unit|units)\s+available\b",
]

WAITLIST_PATTERNS = [
    r"join\s+(?:the\s+)?wait\s*list",
    r"fully\s+occupied",
    r"no\s+units?\s+available",
    r"no\s+availability",
    r"not\s+currently\s+accepting",
]

DEN_PATTERNS = [
    r"\bden\b", r"\+\s*den\b", r"w/\s*den\b", r"loft",
    r"home\s+office", r"bonus\s+room", r"flex\s+(?:room|space)",
    r"attached\s+garage", r"townhome", r"townhouse",
]

BEDROOM_PATTERNS = {
    "studio": [r"studio"],
    "1br": [r"\b1\s*(?:br|bed|bedroom)\b", r"one[- ]bedroom"],
    "2br": [r"\b2\s*(?:br|bed|bedroom)\b", r"two[- ]bedroom"],
    "3br": [r"\b3\s*(?:br|bed|bedroom)\b", r"three[- ]bedroom"],
    "4br": [r"\b4\s*(?:br|bed|bedroom)\b", r"four[- ]bedroom"],
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; ARCH-MFTE-Housing-Tracker/2.0; "
        "+https://github.com/decodedjustice-design/housingtrack-scanner)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.8",
}


def load_json(path, default):
    if not path.exists():
        return default
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def save_json(path, value):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(value, f, indent=2, ensure_ascii=False)


def normalize_text(value):
    return re.sub(r"\s+", " ", value or "").strip().lower()


def matches_any(text, patterns):
    return [pattern for pattern in patterns if re.search(pattern, text, flags=re.I)]


def extract_rents(text):
    values = []
    for match in re.findall(r"\$\s*([\d,]{3,6})(?:\s*(?:/\s*mo|per\s+month|monthly))?", text, flags=re.I):
        try:
            amount = int(match.replace(",", ""))
            if 500 <= amount <= 10000:
                values.append(amount)
        except ValueError:
            continue
    return sorted(set(values))


def extract_sqft(text):
    values = []
    patterns = [
        r"([\d,]{3,5})\s*(?:sq\.?\s*ft|square\s+feet|sf)\b",
        r"\b([\d,]{3,5})\s*sqft\b",
    ]
    for pattern in patterns:
        for match in re.findall(pattern, text, flags=re.I):
            try:
                value = int(match.replace(",", ""))
                if 300 <= value <= 5000:
                    values.append(value)
            except ValueError:
                continue
    return sorted(set(values))


def extract_bedrooms(text):
    found = []
    for bedroom_type, patterns in BEDROOM_PATTERNS.items():
        if matches_any(text, patterns):
            found.append(bedroom_type)
    return found


def eligibility_for_property(prop):
    """Return inclusion/exclusion classification from explicit property metadata.

    Unknown is intentionally retained rather than guessing from the property name.
    """
    programs = {normalize_text(x) for x in prop.get("programs", [])}
    restrictions = {normalize_text(x) for x in prop.get("restricted_populations", [])}
    housing_type = normalize_text(prop.get("housing_type", ""))
    explicit_exclude = normalize_text(prop.get("exclude_reason", ""))

    if prop.get("ha_owned") is True or "kcha" in housing_type or "housing authority" in housing_type:
        return "excluded", "HA-owned/managed"
    if prop.get("senior_only") is True or "senior" in restrictions:
        return "excluded", "senior/age restricted"
    if prop.get("disability_only") is True or "disability-only" in restrictions:
        return "excluded", "disability-only"
    if prop.get("low_income_only") is True:
        return "excluded", "low-income-only"
    if explicit_exclude:
        return "excluded", explicit_exclude

    # If explicit ARCH/MFTE metadata exists, include it.
    if programs.intersection({"arch", "mfte", "inclusionary", "moderate-income", "moderate income"}):
        return "included", "qualifying program metadata"
    if prop.get("affordability_levels"):
        return "included", "affordability metadata present"

    return "review", "eligibility metadata not yet verified"


def discover_relevant_links(base_url, soup):
    """Find availability/floor-plan/leasing links without crawling a whole domain."""
    keywords = (
        "availability", "available", "floor", "floorplan", "floor-plan",
        "apartments", "units", "leasing", "rentals", "pricing", "apply",
    )
    links = []
    base_host = urlparse(base_url).netloc.lower()
    for anchor in soup.find_all("a", href=True):
        href = urljoin(base_url, anchor.get("href", ""))
        if not href.startswith(("http://", "https://")):
            continue
        if urlparse(href).netloc.lower() != base_host:
            continue
        label = normalize_text(anchor.get_text(" ", strip=True))
        haystack = f"{label} {href.lower()}"
        if any(keyword in haystack for keyword in keywords):
            if href not in links:
                links.append(href)
        if len(links) >= MAX_PAGES_PER_PROPERTY - 1:
            break
    return links


def fetch_page(session, url):
    response = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT, allow_redirects=True)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "").lower()
    if "html" not in content_type and not response.text.lstrip().startswith(("<!doctype", "<html", "<HTML")):
        return None, "non_html"
    return BeautifulSoup(response.text, "html.parser"), None


def analyze_pages(prop, pages):
    all_text = []
    availability = []
    waitlist = []
    bedrooms = set()
    rents = set()
    sqft = set()
    den = False

    for url, soup in pages:
        text = normalize_text(soup.get_text(" ", strip=True))
        all_text.append(text)
        availability.extend(matches_any(text, AVAILABLE_PATTERNS))
        waitlist.extend(matches_any(text, WAITLIST_PATTERNS))
        bedrooms.update(extract_bedrooms(text))
        rents.update(extract_rents(text))
        sqft.update(extract_sqft(text))
        den = den or bool(matches_any(text, DEN_PATTERNS))

    available_hits = sorted(set(availability))
    waitlist_hits = sorted(set(waitlist))
    eligibility_status, eligibility_reason = eligibility_for_property(prop)

    if available_hits and not waitlist_hits:
        status = "available"
        signal = "strong"
    elif available_hits and waitlist_hits:
        status = "waitlist_or_limited"
        signal = "mixed"
    elif waitlist_hits:
        status = "waitlist"
        signal = "waitlist"
    else:
        status = "unknown"
        signal = "none"

    min_rent = min(rents) if rents else None
    in_budget = None if min_rent is None else min_rent <= MAX_RENT_WITH_UTILITIES

    return {
        "name": prop["name"],
        "city": prop["city"],
        "url": prop["url"],
        "status": status,
        "signal": signal,
        "availability_signals": available_hits[:10],
        "waitlist_signals": waitlist_hits[:10],
        "bedroom_types_detected": sorted(bedrooms),
        "has_3br": "3br" in bedrooms,
        "has_den_or_flex": den,
        "rents_found": sorted(rents)[:20],
        "min_rent_found": min_rent,
        "sqft_found": sorted(sqft)[:20],
        "in_budget": in_budget,
        "eligibility_status": eligibility_status,
        "eligibility_reason": eligibility_reason,
        "pages_checked": [url for url, _ in pages],
        "details": (
            f"Availability signals: {', '.join(available_hits[:3]) or 'none'}; "
            f"bedrooms: {', '.join(sorted(bedrooms)) or 'not detected'}; "
            f"rent: {('$' + format(min_rent, ',') if min_rent else 'not detected')}"
        ),
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "error": None,
    }


def check_property(session, prop):
    if prop.get("city") not in TARGET_CITIES:
        return None

    eligibility_status, eligibility_reason = eligibility_for_property(prop)
    # Excluded properties remain in the inventory, but we do not poll them.
    if eligibility_status == "excluded":
        return {
            "name": prop["name"],
            "city": prop["city"],
            "url": prop["url"],
            "status": "excluded",
            "signal": "excluded",
            "eligibility_status": "excluded",
            "eligibility_reason": eligibility_reason,
            "pages_checked": [],
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "error": None,
        }

    pages = []
    errors = []
    candidate_urls = [prop["url"]]

    # Explicit pages supplied in properties.json take priority.
    for key in ("availability_url", "floor_plans_url", "leasing_url"):
        value = prop.get(key)
        if value and value not in candidate_urls:
            candidate_urls.append(value)

    try:
        soup, error = fetch_page(session, prop["url"])
        if soup:
            pages.append((prop["url"], soup))
            for discovered in discover_relevant_links(prop["url"], soup):
                if discovered not in candidate_urls:
                    candidate_urls.append(discovered)
    except Exception as exc:
        errors.append(f"base: {str(exc)[:120]}")

    # Fetch the most relevant pages only. This avoids hammering a property site.
    for url in candidate_urls[1:MAX_PAGES_PER_PROPERTY]:
        try:
            soup, error = fetch_page(session, url)
            if soup:
                pages.append((url, soup))
            elif error:
                errors.append(f"{url}: {error}")
        except Exception as exc:
            errors.append(f"{url}: {str(exc)[:120]}")
        time.sleep(POLITE_DELAY_SECONDS)

    if not pages:
        return {
            "name": prop["name"],
            "city": prop["city"],
            "url": prop["url"],
            "status": "error",
            "signal": "error",
            "eligibility_status": eligibility_status,
            "eligibility_reason": eligibility_reason,
            "pages_checked": [],
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "error": "; ".join(errors)[:500],
        }

    result = analyze_pages(prop, pages)
    result["error"] = "; ".join(errors)[:500] if errors else None
    return result


def detect_changes(current_results, previous_results):
    previous = previous_results.get("results", previous_results) if isinstance(previous_results, dict) else {}
    new_available = []
    newly_gone = []

    for name, current in current_results.items():
        if current.get("eligibility_status") == "excluded":
            continue
        previous_item = previous.get(name, {})
        old_status = previous_item.get("status", "unknown")
        new_status = current.get("status", "unknown")
        if new_status == "available" and old_status != "available":
            new_available.append(current)
        elif old_status == "available" and new_status not in ("available", "error"):
            newly_gone.append(current)
    return new_available, newly_gone


def send_email_alert(new_available, newly_gone, smtp_user, smtp_pass):
    if not new_available and not newly_gone:
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Housing Tracker Alert: {len(new_available)} new opening(s)"
    msg["From"] = smtp_user
    msg["To"] = ALERT_EMAIL

    html = [
        "<html><body style='font-family:Arial,sans-serif;max-width:700px;margin:auto'>",
        "<h2>ARCH + MFTE Housing Tracker</h2>",
        f"<p>Scan: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>",
    ]

    if new_available:
        html.append(f"<h3>New availability detected ({len(new_available)})</h3><ul>")
        for item in new_available:
            html.append(
                f"<li><strong>{item['name']}</strong> ({item['city']}) — "
                f"{item.get('details','')} — "
                f"<a href='{item['url']}'>source</a></li>"
            )
        html.append("</ul>")

    if newly_gone:
        html.append(f"<h3>No longer showing availability ({len(newly_gone)})</h3><ul>")
        for item in newly_gone:
            html.append(
                f"<li><strong>{item['name']}</strong> ({item['city']}) — "
                f"<a href='{item['url']}'>recheck source</a></li>"
            )
        html.append("</ul>")

    html.append(
        "<p style='font-size:12px;color:#777'>A scan signal is not a guarantee of an affordable-unit vacancy. "
        "Verify the unit, AMI restriction, rent, eligibility and application status with the property.</p>"
        "</body></html>"
    )
    msg.attach(MIMEText("\n".join(html), "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, ALERT_EMAIL, msg.as_string())


def main():
    started = datetime.now(timezone.utc)
    properties = load_json(PROPERTIES_FILE, [])
    previous = load_json(RESULTS_FILE, {})

    session = requests.Session()
    current_results = {}

    eligible_properties = [p for p in properties if p.get("city") in TARGET_CITIES]
    print(f"Housing Tracker Scanner — {started.isoformat()}")
    print(f"Inventory: {len(properties)} | Target-city records: {len(eligible_properties)}")

    for index, prop in enumerate(eligible_properties, start=1):
        print(f"[{index}/{len(eligible_properties)}] {prop['name']} ({prop['city']})")
        result = check_property(session, prop)
        if result:
            current_results[prop["name"]] = result
        time.sleep(POLITE_DELAY_SECONDS)

    summary = {
        "available": sum(1 for r in current_results.values() if r.get("status") == "available"),
        "waitlist": sum(1 for r in current_results.values() if r.get("status") == "waitlist"),
        "unknown": sum(1 for r in current_results.values() if r.get("status") == "unknown"),
        "error": sum(1 for r in current_results.values() if r.get("status") == "error"),
        "excluded": sum(1 for r in current_results.values() if r.get("status") == "excluded"),
        "review": sum(1 for r in current_results.values() if r.get("eligibility_status") == "review"),
    }

    new_available, newly_gone = detect_changes(current_results, previous)

    payload = {
        "last_scan": datetime.now(timezone.utc).isoformat(),
        "target_cities": sorted(TARGET_CITIES),
        "total": len(current_results),
        "summary": summary,
        "newly_available_count": len(new_available),
        "newly_gone_count": len(newly_gone),
        "results": current_results,
    }
    save_json(RESULTS_FILE, payload)

    history = load_json(HISTORY_FILE, [])
    if not isinstance(history, list):
        history = []
    history.append({
        "scan_at": payload["last_scan"],
        "summary": summary,
        "newly_available": [r["name"] for r in new_available],
        "newly_gone": [r["name"] for r in newly_gone],
    })
    save_json(HISTORY_FILE, history[-500:])

    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    if (new_available or newly_gone) and smtp_user and smtp_pass:
        try:
            send_email_alert(new_available, newly_gone, smtp_user, smtp_pass)
            print("Alert email sent.")
        except Exception as exc:
            print(f"Alert email failed: {exc}")

    print(json.dumps(summary, indent=2))
    print(f"New availability: {len(new_available)} | Newly gone: {len(newly_gone)}")


if __name__ == "__main__":
    main()

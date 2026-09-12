import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent
SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_SECRET_KEY = os.environ["SUPABASE_SECRET_KEY"]
HEADERS = {
    "apikey": SUPABASE_SECRET_KEY,
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates,return=minimal",
}


def load(name, default):
    path = ROOT / name
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        value = json.load(f)
    if isinstance(value, dict) and "results" in value:
        return value["results"]
    if isinstance(value, dict) and "leads" in value:
        return value["leads"]
    return value


def canonical(name, city):
    raw = f"{city}|{name}".strip().lower()
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def post(table, rows, conflict=None):
    if not rows:
        return
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {"on_conflict": conflict} if conflict else {}
    r = requests.post(url, headers=HEADERS, params=params, json=rows, timeout=60)
    r.raise_for_status()


def main():
    properties = load("properties_scoped.json", [])
    availability = load("availability_results.json", [])
    external = load("external_leads.json", [])
    now = datetime.now(timezone.utc).isoformat()

    property_rows = []
    for p in properties:
        name = p.get("name") or p.get("property_name")
        city = p.get("city")
        if not name or not city:
            continue
        property_rows.append({
            "canonical_id": canonical(name, city),
            "name": name,
            "city": city,
            "official_url": p.get("url"),
            "eligibility_status": p.get("eligibility", "needs_program_confirmation"),
            "exclusion_reason": p.get("exclude_reason"),
            "last_checked_at": now,
        })
    post("properties", property_rows, "canonical_id")

    lookup = {}
    if property_rows:
        query = f"?select=id,canonical_id&canonical_id=in.({','.join(r['canonical_id'] for r in property_rows)})"
        r = requests.get(f"{SUPABASE_URL}/rest/v1/properties{query}", headers=HEADERS, timeout=60)
        r.raise_for_status()
        lookup = {x["canonical_id"]: x["id"] for x in r.json()}

    checks = []
    for item in availability:
        name = item.get("name") or item.get("property_name")
        city = item.get("city")
        if not name or not city:
            continue
        property_id = lookup.get(canonical(name, city))
        if not property_id:
            continue
        details = item.get("details") or {}
        bedrooms = details.get("bedroom_types") or []
        rents = details.get("rents") or []
        sqft = details.get("sqft") or []
        checks.append({
            "property_id": property_id,
            "checked_at": item.get("checked_at") or now,
            "status": item.get("status", "unknown"),
            "eligibility_status": item.get("eligibility"),
            "bedroom_type": bedrooms[0] if bedrooms else None,
            "rent": item.get("min_rent") if item.get("min_rent") is not None else (rents[0] if rents else None),
            "sqft": int(sqft[0]) if sqft and isinstance(sqft[0], (int, float)) else None,
            "signal": ", ".join(details.get("availability_signals") or [])[:1000],
            "evidence": {
                "url": item.get("url"),
                "pages_checked": item.get("pages_checked", []),
                "features": details.get("features", []),
                "program_signals": details.get("program_signals", []),
                "quality_control": item.get("quality_control", {}),
            },
        })
    post("availability_checks", checks)

    lead_rows = []
    for lead in external:
        url = lead.get("url")
        source = lead.get("source") or lead.get("source_name") or "external"
        if not url:
            continue
        lead_rows.append({
            "source_name": source,
            "url": url,
            "title": lead.get("title") or lead.get("name"),
            "city": lead.get("city"),
            "program_terms": lead.get("program_terms") or lead.get("matched_terms") or [],
            "found_at": lead.get("found_at") or now,
            "verification_status": "lead_only",
            "evidence": lead,
        })
    post("external_leads", lead_rows, "source_name,url")

    print(f"Synced {len(property_rows)} properties, {len(checks)} availability checks, {len(lead_rows)} external leads")


if __name__ == "__main__":
    main()

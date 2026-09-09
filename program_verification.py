#!/usr/bin/env python3
"""Build a verification queue for the five-city ARCH/MFTE rental inventory.

This does not guess eligibility. It separates verified program records from
properties that still require source confirmation, and explicitly flags HA,
senior, disability-only and low-income-only exclusions.
"""
import json
from pathlib import Path
from datetime import datetime, timezone

PROPERTIES = Path("properties.json")
OUT = Path("program_verification.json")
TARGET_CITIES = {"Bellevue", "Redmond", "Bothell", "Kirkland", "Woodinville"}
EXCLUDED_HOUSING_TYPES = {"kcha", "housing authority"}
PROGRAMS = {"arch", "mfte", "inclusionary", "moderate-income", "moderate income"}


def norm(v):
    return str(v or "").strip().lower()


def classify(p):
    programs = {norm(x) for x in p.get("programs", [])}
    restrictions = {norm(x) for x in p.get("restricted_populations", [])}
    housing_type = norm(p.get("housing_type"))

    if p.get("ha_owned") is True or housing_type in EXCLUDED_HOUSING_TYPES:
        return "excluded", "HA-owned/managed"
    if p.get("senior_only") is True or "senior" in restrictions:
        return "excluded", "senior/age restricted"
    if p.get("disability_only") is True or "disability-only" in restrictions:
        return "excluded", "disability-only"
    if p.get("low_income_only") is True:
        return "excluded", "low-income-only"
    if programs & PROGRAMS:
        return "verified_program", "explicit ARCH/MFTE/moderate-income metadata"
    if p.get("affordability_levels"):
        return "needs_program_confirmation", "affordability metadata exists but program is not explicit"
    return "needs_program_confirmation", "program metadata missing"


def main():
    properties = json.loads(PROPERTIES.read_text(encoding="utf-8"))
    records = []
    seen = set()
    for p in properties:
        if p.get("city") not in TARGET_CITIES:
            continue
        key = (norm(p.get("name")), norm(p.get("city")), norm(p.get("url")))
        if key in seen:
            continue
        seen.add(key)
        status, reason = classify(p)
        records.append({
            "property_id": f"{norm(p.get('city')).replace(' ', '-')}-{norm(p.get('name')).replace(' ', '-')}",
            "name": p.get("name"),
            "city": p.get("city"),
            "official_url": p.get("url"),
            "programs": p.get("programs", []),
            "affordability_levels": p.get("affordability_levels", []),
            "status": status,
            "reason": reason,
            "needs_human_verification": status == "needs_program_confirmation",
            "checked_at": datetime.now(timezone.utc).isoformat(),
        })

    summary = {
        "total": len(records),
        "verified_program": sum(r["status"] == "verified_program" for r in records),
        "needs_program_confirmation": sum(r["status"] == "needs_program_confirmation" for r in records),
        "excluded": sum(r["status"] == "excluded" for r in records),
    }
    OUT.write_text(json.dumps({"generated_at": datetime.now(timezone.utc).isoformat(), "summary": summary, "records": records}, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

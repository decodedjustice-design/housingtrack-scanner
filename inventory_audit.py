#!/usr/bin/env python3
"""Audit the master property inventory before expanding the scanner/dashboard."""

import json
from collections import Counter, defaultdict
from pathlib import Path

PROPERTIES = Path("properties.json")
POLICY = Path("inventory_policy.json")
OUTPUT = Path("inventory_audit.json")


def load(path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def main():
    properties = load(PROPERTIES)
    policy = load(POLICY)
    target = set(policy["target_cities"])

    target_rows = [p for p in properties if p.get("city") in target]
    out_of_scope = [p for p in properties if p.get("city") not in target]

    by_city = Counter(p.get("city", "Unknown") for p in target_rows)
    duplicate_names = {
        name: count
        for name, count in Counter(p.get("name", "").strip().lower() for p in target_rows).items()
        if name and count > 1
    }

    missing = defaultdict(list)
    for p in target_rows:
        name = p.get("name", "Unnamed")
        for field in ("url", "programs", "affordability_levels", "address", "availability_url", "floor_plans_url"):
            value = p.get(field)
            if value in (None, "", []):
                missing[field].append(name)

    explicit_exclusions = []
    for p in target_rows:
        flags = []
        if p.get("ha_owned") is True:
            flags.append("HA-owned/managed")
        if p.get("senior_only") is True:
            flags.append("senior/age restricted")
        if p.get("disability_only") is True:
            flags.append("disability-only")
        if p.get("low_income_only") is True:
            flags.append("low-income-only")
        if p.get("exclude_reason"):
            flags.append(p["exclude_reason"])
        if flags:
            explicit_exclusions.append({"name": p.get("name"), "city": p.get("city"), "reasons": flags})

    report = {
        "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "target_cities": sorted(target),
        "total_inventory_records": len(properties),
        "target_city_records": len(target_rows),
        "out_of_scope_records": len(out_of_scope),
        "records_by_target_city": dict(sorted(by_city.items())),
        "duplicate_names_in_target": duplicate_names,
        "missing_fields": {k: sorted(v) for k, v in missing.items()},
        "explicit_exclusions": explicit_exclusions,
        "next_data_work": [
            "Verify each target-city property against ARCH's current apartment inventory/search tool.",
            "Add explicit ARCH/MFTE/moderate-income program metadata instead of inferring eligibility from availability text.",
            "Add official availability and floor-plan URLs wherever available.",
            "Resolve duplicate property names and incorrect city/URL pairings before dashboard publication.",
            "Keep mixed-income properties when qualifying ARCH/MFTE/moderate-income units exist; exclude only explicitly disallowed inventory."
        ]
    }

    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

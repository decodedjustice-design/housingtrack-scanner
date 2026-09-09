#!/usr/bin/env python3
"""Build the scanner's canonical five-city inventory from properties.json.

The repository keeps properties.json as the broad/source inventory. This script
creates properties_scoped.json for the live scanner, limited to the five requested
cities, with exact duplicate records removed. It also applies high-confidence city
corrections and a conservative exclusion screen for properties documented as
100% restricted in the 2024 King County IRHD dataset.
"""

import json
from pathlib import Path

SOURCE = Path("properties.json")
OUTPUT = Path("properties_scoped.json")
EXCLUSION_FILE = Path("excluded_full_restricted_2024.txt")
TARGET_CITIES = {"Redmond", "Bellevue", "Bothell", "Kirkland", "Woodinville"}

CITY_CORRECTIONS = {
    ("Ascent Bellevue", "Bellevue"): "Kirkland",
}


def load_exclusions():
    exclusions = set()
    if not EXCLUSION_FILE.exists():
        return exclusions
    for line in EXCLUSION_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "|" not in line:
            continue
        city, name = [part.strip() for part in line.split("|", 1)]
        if city in TARGET_CITIES and name:
            exclusions.add((city.lower(), name.lower()))
    return exclusions


def main():
    records = json.loads(SOURCE.read_text(encoding="utf-8"))
    exclusions = load_exclusions()
    scoped = []
    seen = set()
    corrections = []
    excluded_out_of_scope = 0
    excluded_full_restricted = []
    duplicates = 0

    for record in records:
        item = dict(record)
        name = str(item.get("name", "")).strip()
        city = str(item.get("city", "")).strip()
        key = (name, city)

        corrected_city = CITY_CORRECTIONS.get(key)
        if corrected_city:
            item["city"] = corrected_city
            corrections.append({"name": name, "from": city, "to": corrected_city})
            city = corrected_city

        if city not in TARGET_CITIES:
            excluded_out_of_scope += 1
            continue

        exclusion_key = (city.lower(), name.lower())
        if exclusion_key in exclusions:
            excluded_full_restricted.append({
                "name": name,
                "city": city,
                "reason": "100%-low-income-only / fully restricted in 2024 IRHD screening dataset",
            })
            continue

        dedupe_key = (
            name.lower(),
            city.lower(),
            str(item.get("url", "")).strip().lower(),
        )
        if dedupe_key in seen:
            duplicates += 1
            continue
        seen.add(dedupe_key)
        scoped.append(item)

    scoped.sort(key=lambda x: (x.get("city", ""), x.get("name", "").lower()))
    OUTPUT.write_text(json.dumps(scoped, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(json.dumps({
        "source_records": len(records),
        "scoped_records": len(scoped),
        "excluded_out_of_scope": excluded_out_of_scope,
        "excluded_full_restricted": len(excluded_full_restricted),
        "excluded_full_restricted_records": excluded_full_restricted,
        "duplicates_removed": duplicates,
        "city_corrections": corrections,
        "target_cities": sorted(TARGET_CITIES),
        "output": str(OUTPUT),
    }, indent=2))


if __name__ == "__main__":
    main()

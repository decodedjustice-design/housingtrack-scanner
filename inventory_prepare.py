#!/usr/bin/env python3
"""Build the scanner's canonical five-city inventory from properties.json.

The repository keeps properties.json as the broad/source inventory. This script
creates properties_scoped.json for the live scanner, limited to the five requested
cities, with exact duplicate records removed. It also applies only high-confidence
city corrections where the existing record is internally contradictory.
"""

import json
from pathlib import Path

SOURCE = Path("properties.json")
OUTPUT = Path("properties_scoped.json")
TARGET_CITIES = {"Redmond", "Bellevue", "Bothell", "Kirkland", "Woodinville"}

# High-confidence corrections found during the inventory audit.
CITY_CORRECTIONS = {
    ("Ascent Bellevue", "Bellevue"): "Kirkland",
}


def main():
    records = json.loads(SOURCE.read_text(encoding="utf-8"))
    scoped = []
    seen = set()
    corrections = []
    excluded_out_of_scope = 0
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

        # Deduplicate exact name/city/url records. Keep the first source record.
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
        "duplicates_removed": duplicates,
        "city_corrections": corrections,
        "target_cities": sorted(TARGET_CITIES),
        "output": str(OUTPUT),
    }, indent=2))


if __name__ == "__main__":
    main()

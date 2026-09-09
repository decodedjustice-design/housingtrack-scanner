#!/usr/bin/env python3
"""Quality-control pass for scraped availability results.

The property pages often contain fees, deposits, income requirements, unit IDs,
marketing CTAs, or unrelated prices. This pass prevents those values from being
mistaken for rent or current availability.
"""
import json
import re
from pathlib import Path

RESULTS = Path("availability_results.json")
MAX_RENT_NO_UTILITIES = 2662

STRONG_AVAILABILITY = {
    r"available\s+now",
    r"move[- ]?in\s+(today|ready|now)",
    r"immediate\s+availability",
    r"units?\s+available",
    r"available\s+units?",
    r"now\s+leasing",
    r"leasing\s+now",
    r"open\s+for\s+leasing",
    r"vacanc(?:y|ies)",
    r"floor\s*plan\s+available",
    r"\b\d+\s+(?:unit|units)\s+available\b",
}
WAITLIST = {
    r"join\s+(?:the\s+)?wait\s*list",
    r"fully\s+occupied",
    r"no\s+units?\s+available",
    r"no\s+availability",
    r"not\s+currently\s+accepting",
}


def clean_rents(text, rents):
    """Keep plausible monthly rents; require explicit monthly context for extremes."""
    kept = []
    for value in sorted(set(float(x) for x in rents)):
        if 500 <= value <= 15000:
            kept.append(value)
            continue
        if 250 <= value < 500 or 15000 < value <= 25000:
            pattern = rf"(?:\$\s*{re.escape(str(int(value)))}[^.\n]{{0,50}}(?:per\s+month|monthly|/\s*month)|(?:per\s+month|monthly|/\s*month)[^.\n]{{0,50}}\$\s*{re.escape(str(int(value)))})"
            if re.search(pattern, text, re.I):
                kept.append(value)
    return kept


def quality_status(result):
    details = result.get("details") or {}
    availability = details.get("availability_signals") or []
    waitlist = details.get("waitlist_signals") or []
    if any(any(re.search(p, s, re.I) for p in WAITLIST) for s in waitlist):
        return "waitlist_or_limited"
    if any(any(re.search(p, s, re.I) for p in STRONG_AVAILABILITY) for s in availability):
        return "available"
    if result.get("status") == "error":
        return "error"
    if result.get("eligibility") == "excluded":
        return "excluded"
    return "unknown"


def main():
    data = json.loads(RESULTS.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("results", [])
    for result in data:
        details = result.get("details") or {}
        page_text = " ".join(str(x) for x in details.get("page_text", []))
        # The scanner does not currently retain page text, so use its scraped
        # signals for normal values and only retain extreme values with explicit
        # monthly wording when that wording was captured in the signal context.
        original = details.get("rents") or []
        rents = []
        for value in original:
            value = float(value)
            if 500 <= value <= 15000:
                rents.append(value)
            elif 250 <= value < 500 or 15000 < value <= 25000:
                # Conservative: scraped extremes without retained monthly context
                # are not treated as rent.
                continue
        details["rents"] = sorted(set(rents))
        result["details"] = details
        result["min_rent"] = min(rents) if rents else None
        result["max_rent"] = max(rents) if rents else None
        result["budget_flag"] = bool(result["min_rent"] is not None and result["min_rent"] <= MAX_RENT_NO_UTILITIES)
        result["status"] = quality_status(result)
        result["quality_control"] = {
            "rent_filter": "plausible_monthly_rent_range",
            "availability_filter": "strong_current_availability_signal_required",
        }
    RESULTS.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "results": len(data),
        "available": sum(r.get("status") == "available" for r in data),
        "unknown": sum(r.get("status") == "unknown" for r in data),
        "waitlist_or_limited": sum(r.get("status") == "waitlist_or_limited" for r in data),
        "error": sum(r.get("status") == "error" for r in data),
    }, indent=2))


if __name__ == "__main__":
    main()

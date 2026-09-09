# Housing Tracker Availability Scanner

Automated GitHub Actions workflow for an **ARCH + MFTE housing availability tracker** focused on Redmond, Bellevue, Bothell, Kirkland, and Woodinville.

## What it checks

- Official property websites
- Availability pages
- Floor-plan pages
- Leasing / pricing pages discovered from property sites
- Secondary public listing leads from Craigslist, Zumper, Apartments.com, and Apartment Finder

The official property scanner runs every **2 hours**. Secondary marketplace results are treated as leads and require verification; they do not establish ARCH/MFTE eligibility or current vacancy by themselves.

## Eligibility policy

The tracker keeps explicit eligibility metadata separate from vacancy detection.

**In scope:** ARCH, MFTE, inclusionary, and qualifying moderate-income units.

**Excluded when explicitly applicable:**
- HA-owned/managed
- senior or age-restricted
- disability-only
- low-income-only

A mixed-income property is **not** excluded merely because it also contains lower-income units. If qualifying ARCH/MFTE/moderate-income units exist, the property remains in the tracker and the qualifying inventory must be identified.

## Current scanner behavior

1. `inventory_audit.py` audits the five-city inventory and flags duplicates/missing metadata.
2. `scanner.py` polls target-city properties and follows relevant availability/floor-plan/leasing links.
3. `external_scanner.py` collects secondary marketplace leads using public search results without bypassing login, CAPTCHA, rate limits, or access controls.
4. `availability_results.json` stores the latest official scan results and evidence URLs.
5. `external_leads.json` stores marketplace leads and verification status.
6. `inventory_audit.json` stores the latest inventory-quality audit.
7. `scan_history.json` records scan history and availability changes.

## Evidence standard

A keyword such as “available now” is a **scan signal**, not proof that an ARCH/MFTE unit is available. The dashboard should show the source URL and timestamp and require verification of:

- qualifying program
- AMI / income restriction
- bedroom type
- rent
- square footage
- actual current availability
- application status

ARCH itself states that applicants must contact properties directly to apply and that ARCH does not actively track vacancies. The tracker therefore adds a monitoring layer rather than treating ARCH as a real-time vacancy feed.

## GitHub Actions

The workflow runs every 2 hours, can be manually dispatched, and also runs when scanner changes are pushed to `main`.

The workflow commits updated scan artifacts back to `main`.

## Files

| File | Purpose |
|---|---|
| `scanner.py` | Official property availability scanner |
| `external_scanner.py` | Secondary marketplace lead collector |
| `properties.json` | Master property inventory |
| `inventory_policy.json` | Target cities, program scope, and exclusion rules |
| `inventory_audit.py` | Inventory quality audit |
| `inventory_audit.json` | Latest audit output |
| `availability_results.json` | Latest official scan results |
| `external_leads.json` | Secondary listing leads |
| `scan_history.json` | Historical scan/change record |
| `.github/workflows/scan.yml` | Two-hour GitHub Actions schedule |

## Manual run

```bash
pip install requests beautifulsoup4 lxml
python inventory_audit.py
python scanner.py
python external_scanner.py
```

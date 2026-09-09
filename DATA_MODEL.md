# Housing Tracker data model

## Property record

Every tracked building should ultimately carry these fields:

- `name`
- `city`
- `address`
- `url`
- `availability_url`
- `floor_plans_url`
- `leasing_url`
- `programs` — `ARCH`, `MFTE`, `inclusionary`, etc.
- `affordability_levels` — AMI bands when verified
- `restricted_bedrooms` — qualifying bedroom types
- `unit_count`
- `affordable_unit_count`
- `rent_ranges`
- `sqft_ranges`
- `features` — den, office, garage, townhome, etc.
- `ha_owned`
- `senior_only`
- `disability_only`
- `low_income_only`
- `eligibility_status`
- `source_last_verified`

## Availability result

The scanner records:

- current status
- availability signals
- waitlist signals
- bedroom types detected
- rents found
- square footage found
- budget flag
- pages checked
- check timestamp
- error information

## External listing lead

External marketplace listings are stored as leads rather than authoritative availability:

- `source`
- `listing_url`
- `property_name`
- `city`
- `bedroom_type`
- `advertised_rent`
- `sqft`
- `posted_or_updated_at`
- `first_seen_at`
- `last_seen_at`
- `lead_status`
- `program_claim`
- `verification_status`
- `verification_url`

A marketplace listing cannot by itself establish that a unit is ARCH/MFTE eligible. The dashboard should label these as **External Lead — Verify** until the property/program source confirms eligibility and availability.

## Exclusions

The tracker intentionally excludes from active polling:

1. HA-owned/managed properties
2. senior/age-restricted properties
3. disability-only properties
4. properties explicitly identified as low-income-only

A mixed-income building should not be excluded merely because it contains some lower-income units; the qualifying ARCH/MFTE inventory must be evaluated separately.

# Decoded Housing Web

Independent frontend for the ARCH + MFTE availability scanner. It reads the scanner's generated JSON from the public GitHub `main` branch and does not depend on Lovable.

## Current capabilities
- Dashboard metrics and recent scanner results
- Availability search/filtering
- Property directory
- Source monitor
- Conservative alert view
- Responsive Decoded Housing visual system
- Evidence-first status labels and timestamps

## Architecture
`GitHub Actions scanner (every 2 hours) -> JSON outputs -> this frontend`

Marketplace records remain leads; unknown/error/program-review records are not presented as confirmed availability.

## Deploy
This directory is static and can be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages. No secrets are required for the current read-only frontend.

For the next phase, connect the frontend to Supabase for preferences, alerts, canonical property/unit records, availability history, and authenticated admin/source management.

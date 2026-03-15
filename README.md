# Housing Tracker Availability Scanner

Automated GitHub Actions workflow that scans **89 property websites** 3× daily and emails alerts when availability changes.

## How It Works

1. **`scanner.py`** — fetches each property website, looks for availability keywords, and compares results to the previous scan
2. **`availability_results.json`** — updated after every scan; the housing tracker website reads this file to show live status
3. **`.github/workflows/scan.yml`** — runs the scanner at 7am, 12pm, and 6pm PT daily

## Setup (One-Time)

### 1. Add Gmail App Password as a Secret

The scanner sends email via Gmail. You need to create an **App Password** (not your regular Gmail password):

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already on
3. Go to **App passwords** → create one named "Housing Scanner"
4. Copy the 16-character password

Then add it to this repo:
1. Go to **Settings → Secrets and variables → Actions**
2. Add two secrets:
   - `SMTP_USER` = `DecodedJustice@gmail.com`
   - `SMTP_PASS` = *(the 16-char App Password)*

### 2. Enable GitHub Actions

Actions are enabled by default on new repos. You can trigger a manual scan anytime from the **Actions** tab → **Housing Availability Scanner** → **Run workflow**.

## Email Alerts

You'll receive an email at `DecodedJustice@gmail.com` when:
- A property **becomes available** (was not available before)
- A property **is no longer available** (was available before)

No email is sent if nothing changed.

## Availability Keywords

The scanner looks for phrases like:
- "available now", "now leasing", "units available", "apply now"
- "schedule a tour", "floor plan available", "X units available"

And flags waitlist signals like:
- "join waitlist", "fully occupied", "no units available"

## Files

| File | Purpose |
|------|---------|
| `scanner.py` | Main scanner script |
| `properties.json` | List of 89 properties with URLs to scan |
| `availability_results.json` | Latest scan results (auto-updated) |
| `requirements.txt` | Python dependencies |
| `.github/workflows/scan.yml` | GitHub Actions schedule |

## Manual Run

```bash
pip install -r requirements.txt
SMTP_USER=your@gmail.com SMTP_PASS=yourapppassword python scanner.py
```

#!/usr/bin/env python3
"""
Housing Tracker Availability Scanner
Scans property websites for availability keywords and detects changes.
Sends email alerts when new availability is found.
"""

import json
import os
import re
import smtplib
import sys
import time
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ── Config ──────────────────────────────────────────────────────────────────
ALERT_EMAIL = "DecodedJustice@gmail.com"
RESULTS_FILE = Path("availability_results.json")
PROPERTIES_FILE = Path("properties.json")

# Keywords that strongly suggest a unit is available NOW
AVAILABLE_KEYWORDS = [
    "available now",
    "move in today",
    "move-in ready",
    "ready now",
    "immediate availability",
    "units available",
    "apply now",
    "schedule a tour",
    "check availability",
    "view available",
    "see available",
    "available units",
    "now leasing",
    "leasing now",
    "open for leasing",
    "vacancies",
    "vacant",
    "floor plan available",
    "available floor",
    r"\d+ available",
    r"\d+ unit[s]? available",
    r"available.*\d+ bed",
]

# Keywords that suggest waitlist / not available
WAITLIST_KEYWORDS = [
    "join waitlist",
    "join the waitlist",
    "waitlist",
    "wait list",
    "no units available",
    "fully occupied",
    "no availability",
    "not currently accepting",
    "contact for availability",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def load_properties():
    with open(PROPERTIES_FILE) as f:
        return json.load(f)


def load_previous_results():
    if RESULTS_FILE.exists():
        with open(RESULTS_FILE) as f:
            return json.load(f)
    return {}


def check_property(prop):
    """Check a single property URL for availability signals."""
    url = prop["url"]
    name = prop["name"]
    
    # Try to find a more specific availability/floor-plans page
    availability_paths = [
        "/availability", "/floor-plans", "/floorplans", "/apartments",
        "/available-apartments", "/available-units", "/apply",
    ]
    
    result = {
        "name": name,
        "city": prop["city"],
        "url": url,
        "status": "unknown",
        "signal": "none",
        "details": "",
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "error": None,
    }
    
    try:
        # First try the base URL
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
        text_lower = resp.text.lower()
        soup = BeautifulSoup(resp.text, "html.parser")
        page_text = soup.get_text(" ", strip=True).lower()
        
        # Check for availability keywords
        found_available = []
        for kw in AVAILABLE_KEYWORDS:
            if re.search(kw, page_text):
                found_available.append(kw)
        
        found_waitlist = []
        for kw in WAITLIST_KEYWORDS:
            if kw in page_text:
                found_waitlist.append(kw)
        
        if found_available and not found_waitlist:
            result["status"] = "available"
            result["signal"] = "strong"
            result["details"] = f"Keywords found: {', '.join(found_available[:3])}"
        elif found_available and found_waitlist:
            result["status"] = "waitlist_or_limited"
            result["signal"] = "mixed"
            result["details"] = f"Available: {found_available[:2]}, Waitlist: {found_waitlist[:2]}"
        elif found_waitlist:
            result["status"] = "waitlist"
            result["signal"] = "waitlist"
            result["details"] = f"Waitlist keywords: {', '.join(found_waitlist[:3])}"
        else:
            result["status"] = "unknown"
            result["signal"] = "none"
            result["details"] = "No clear availability signal found"
            
    except requests.exceptions.Timeout:
        result["error"] = "timeout"
        result["status"] = "error"
    except requests.exceptions.ConnectionError:
        result["error"] = "connection_error"
        result["status"] = "error"
    except Exception as e:
        result["error"] = str(e)[:100]
        result["status"] = "error"
    
    return result


def send_email_alert(new_available, newly_gone, smtp_user, smtp_pass):
    """Send email alert for availability changes."""
    if not new_available and not newly_gone:
        return
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🏠 Housing Alert: {len(new_available)} new opening(s) detected"
    msg["From"] = smtp_user
    msg["To"] = ALERT_EMAIL
    
    # Build HTML email
    html_parts = ["""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1e40af;">🏠 Housing Tracker Alert</h2>
    <p style="color: #6b7280;">Scan completed: """ + datetime.now().strftime("%B %d, %Y at %I:%M %p") + """</p>
    """]
    
    if new_available:
        html_parts.append("""
        <h3 style="color: #16a34a;">✅ Newly Available (%d properties)</h3>
        <table style="width:100%%; border-collapse: collapse;">
        <tr style="background:#f0fdf4;">
            <th style="padding:8px; text-align:left; border:1px solid #bbf7d0;">Property</th>
            <th style="padding:8px; text-align:left; border:1px solid #bbf7d0;">City</th>
            <th style="padding:8px; text-align:left; border:1px solid #bbf7d0;">Signal</th>
            <th style="padding:8px; text-align:left; border:1px solid #bbf7d0;">Link</th>
        </tr>
        """ % len(new_available))
        for p in new_available:
            html_parts.append(f"""
        <tr>
            <td style="padding:8px; border:1px solid #d1fae5;"><strong>{p['name']}</strong></td>
            <td style="padding:8px; border:1px solid #d1fae5;">{p['city']}</td>
            <td style="padding:8px; border:1px solid #d1fae5; font-size:12px; color:#6b7280;">{p.get('details','')}</td>
            <td style="padding:8px; border:1px solid #d1fae5;"><a href="{p['url']}">Visit →</a></td>
        </tr>""")
        html_parts.append("</table>")
    
    if newly_gone:
        html_parts.append("""
        <h3 style="color: #dc2626; margin-top:24px;">❌ No Longer Available (%d properties)</h3>
        <ul>""" % len(newly_gone))
        for p in newly_gone:
            html_parts.append(f"<li><strong>{p['name']}</strong> ({p['city']}) — <a href='{p['url']}'>check site</a></li>")
        html_parts.append("</ul>")
    
    html_parts.append("""
    <hr style="margin-top:24px; border:none; border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af; font-size:12px;">
        This alert was sent by the <strong>ARCH + Market Rate Housing Tracker</strong> automated scanner.<br>
        Scans run 3× daily at 7am, 12pm, and 6pm PT.<br>
        <a href="https://housingtrack-x59yrvfp.manus.space">View full tracker →</a>
    </p>
    </body></html>""")
    
    html_body = "".join(html_parts)
    msg.attach(MIMEText(html_body, "html"))
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, ALERT_EMAIL, msg.as_string())
        print(f"✅ Alert email sent to {ALERT_EMAIL}")
    except Exception as e:
        print(f"⚠️  Email send failed: {e}")


def main():
    print(f"🔍 Housing Tracker Scanner — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    
    properties = load_properties()
    previous = load_previous_results()
    
    print(f"   Scanning {len(properties)} properties...")
    
    current_results = {}
    new_available = []
    newly_gone = []
    
    for i, prop in enumerate(properties):
        name = prop["name"]
        print(f"   [{i+1}/{len(properties)}] {name}...", end=" ", flush=True)
        
        result = check_property(prop)
        current_results[name] = result
        
        prev_status = previous.get(name, {}).get("status", "unknown")
        curr_status = result["status"]
        
        print(curr_status)
        
        # Detect changes
        if curr_status == "available" and prev_status not in ("available",):
            new_available.append(result)
        elif prev_status == "available" and curr_status not in ("available",):
            newly_gone.append(result)
        
        # Be polite to servers
        time.sleep(1.5)
    
    # Save results
    with open(RESULTS_FILE, "w") as f:
        json.dump({
            "last_scan": datetime.now(timezone.utc).isoformat(),
            "total": len(current_results),
            "available_count": sum(1 for r in current_results.values() if r["status"] == "available"),
            "results": current_results,
        }, f, indent=2)
    
    print(f"\n📊 Summary:")
    print(f"   Available: {sum(1 for r in current_results.values() if r['status'] == 'available')}")
    print(f"   Waitlist:  {sum(1 for r in current_results.values() if r['status'] == 'waitlist')}")
    print(f"   Unknown:   {sum(1 for r in current_results.values() if r['status'] == 'unknown')}")
    print(f"   Errors:    {sum(1 for r in current_results.values() if r['status'] == 'error')}")
    print(f"\n🔔 Changes:")
    print(f"   Newly available: {len(new_available)}")
    print(f"   Newly gone:      {len(newly_gone)}")
    
    # Send email if there are changes
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")
    
    if (new_available or newly_gone) and smtp_user and smtp_pass:
        send_email_alert(new_available, newly_gone, smtp_user, smtp_pass)
    elif new_available or newly_gone:
        print("⚠️  Changes detected but SMTP credentials not set — skipping email")
    else:
        print("   No changes detected — no email sent")
    
    print("\n✅ Scan complete.")


if __name__ == "__main__":
    main()

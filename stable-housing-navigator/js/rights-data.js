/**
 * Rights & Legal Protections — King County / Washington State
 *
 * IMPORTANT: This is legal information, not legal advice.
 * Laws change. Some provisions require legal verification.
 * Users should consult an attorney or legal aid for their specific situation.
 * Items marked needsVerification: true require current confirmation.
 */

export const rights = [

  /* ============================================================
     WASHINGTON STATE RESIDENTIAL LANDLORD-TENANT ACT (RLTA)
  ============================================================ */
  {
    id: 'rlta-notice-requirements',
    title: 'Eviction Notice Requirements (Washington State)',
    category: 'eviction',
    trigger: ['eviction_notice', 'eviction_served'],
    summary: 'Landlords in Washington must follow specific notice requirements before filing an eviction lawsuit. The type of notice depends on the reason for eviction.',
    details: `Under RCW 59.18, Washington landlords must give written notice before filing an eviction (unlawful detainer) lawsuit. Common notice types:

• 3-Day Notice to Pay or Vacate: For non-payment of rent
• 10-Day Notice to Comply or Vacate: For lease violations
• 20-Day Notice: For month-to-month tenancies (no-cause)
• Just Cause Requirements: If you live in Seattle or certain other cities, landlords may have additional "just cause" requirements before eviction

The notice must be properly served. If the notice is defective (wrong dates, wrong amounts, improper service), the eviction case may be dismissible.`,
    whatToDoc: [
      'Keep the original notice you received — do not throw it away',
      'Note the exact date the notice was posted or handed to you',
      'Check if the amount on the notice is correct',
      'Check if the notice period gives you enough days before the response deadline',
    ],
    contacts: ['Northwest Justice Project', 'Tenants Union of Washington State'],
    urgency: 'high',
    needsVerification: true,
    verifyNote: 'Notice requirements and just cause rules have changed. Verify current RCW 59.18 requirements and any city-specific rules for your location.',
    source: 'RCW 59.18 — Washington Residential Landlord-Tenant Act',
    lawCitation: 'RCW 59.18.057, RCW 59.12.030',
  },
  {
    id: 'rlta-habitability',
    title: 'Right to Habitable Housing (Washington State)',
    category: 'habitability',
    trigger: ['unsafe_housing', 'uninhabitable', 'repairs_needed'],
    summary: 'Washington landlords are required by law to maintain rental housing in a habitable condition. Tenants have rights when landlords fail to make needed repairs.',
    details: `Under RCW 59.18.060, landlords must maintain:
• Weathertight roof, walls, and windows
• Plumbing, heating, and electrical systems in good working order
• Hot and cold running water
• No rodent or insect infestations
• Safe and sanitary conditions

Tenant remedies for failed repairs:
1. Written notice to landlord (certified mail recommended)
2. If landlord does not respond within the statutory time, you may have remedies including repair-and-deduct (for repairs under $1,500 or 1 month's rent, whichever is less — Needs Verification), rent withholding under RCW 59.18.110, or lease termination in serious cases

IMPORTANT: Follow the legal steps exactly or you may lose your remedies.`,
    whatToDoc: [
      'Document all repair issues with photos and videos (with dates)',
      'Send written notice to landlord by certified mail — keep the receipt',
      'Keep copies of all communications',
      'Note any health impacts on family members',
    ],
    contacts: ['Tenants Union of Washington State', 'Northwest Justice Project'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Repair-and-deduct limits and procedures change. Verify current statutory amounts and required steps under RCW 59.18.',
    source: 'RCW 59.18.060, RCW 59.18.070, RCW 59.18.110',
    lawCitation: 'RCW 59.18.060',
  },
  {
    id: 'rlta-retaliation',
    title: 'Protection Against Retaliatory Eviction (Washington State)',
    category: 'eviction',
    trigger: ['eviction_notice', 'eviction_served', 'complained_about_conditions'],
    summary: 'Washington State law protects tenants from eviction or other retaliation after they complain about housing conditions, join a tenant organization, or exercise other legal rights.',
    details: `Under RCW 59.18.240, a landlord may not retaliate against a tenant for:
• Complaining to a governmental agency about habitability
• Organizing or joining a tenant organization
• Reporting code violations

If a landlord takes adverse action (eviction, rent increase, reduction in services) within 90 days of a protected activity, there is a legal presumption of retaliation that the landlord must rebut.

Evidence of retaliation can be used as a defense in an eviction case.`,
    whatToDoc: [
      'Keep records of when you complained to the landlord or a government agency',
      'Document any adverse actions the landlord took after you complained',
      'Note the dates and timeline carefully',
    ],
    contacts: ['Northwest Justice Project', 'Tenants Union of Washington State'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Verify current retaliation statute provisions — RCW 59.18.240.',
    source: 'RCW 59.18.240',
    lawCitation: 'RCW 59.18.240',
  },

  /* ============================================================
     SEATTLE-SPECIFIC PROTECTIONS
  ============================================================ */
  {
    id: 'seattle-just-cause',
    title: 'Just Cause Eviction — Seattle',
    category: 'eviction',
    trigger: ['eviction_notice', 'no_cause_eviction', 'seattle'],
    summary: 'If you live in the City of Seattle, your landlord generally must have a valid legal reason ("just cause") to evict you, even after a lease ends.',
    details: `Seattle Municipal Code 22.206.160 (Just Cause Eviction Ordinance) limits landlords in Seattle from ending a tenancy without a specific valid reason, including:

• Non-payment of rent
• Lease violations
• Demolition or substantial renovation
• Owner move-in (with requirements)
• Sale of property (with requirements)

"Just cause" rules generally apply to residential tenants in Seattle. There are some exceptions (e.g., certain owner-occupied situations).

If your landlord served you a no-cause notice in Seattle, you may have grounds to challenge the eviction.`,
    whatToDoc: [
      'Confirm you are in Seattle city limits (not just King County)',
      'Keep the notice your landlord served',
      'Note whether the landlord stated any reason for the eviction',
    ],
    contacts: ['Tenants Union of Washington State', 'Northwest Justice Project', 'Seattle Office of Housing'],
    urgency: 'high',
    needsVerification: true,
    verifyNote: 'Seattle\'s just cause rules have been updated. Verify current SMC 22.206.160 provisions and any recent changes.',
    source: 'Seattle Municipal Code 22.206.160',
    lawCitation: 'SMC 22.206.160',
    citySpecific: 'Seattle',
  },
  {
    id: 'seattle-rental-agreement',
    title: 'Seattle Rental Agreement Requirements',
    category: 'tenancy',
    trigger: ['lease_question', 'no_written_lease', 'seattle'],
    summary: 'Seattle has requirements about written rental agreements, move-in fee limitations, and tenant screening notice requirements.',
    details: `Seattle laws include:
• Requirement for written rental agreements in certain circumstances
• Limits on move-in fees and deposits (cannot exceed total of first month's rent — Needs Verification for current rules)
• Requirement for landlords to accept first qualifying applicant (first-come, first-served rental)
• Limits on criminal background screening
• Requirements to accept Section 8/vouchers (source of income protection)`,
    whatToDoc: ['Keep your rental agreement', 'Document move-in fees paid'],
    contacts: ['Tenants Union of Washington State', 'Seattle Office of Housing'],
    urgency: 'low',
    needsVerification: true,
    verifyNote: 'Seattle rental rules change frequently. Verify current requirements for deposit limits, first-in-time, and screening.',
    source: 'Seattle Municipal Code Chapter 7.24',
    lawCitation: 'SMC 7.24',
    citySpecific: 'Seattle',
  },

  /* ============================================================
     FAIR HOUSING & DISCRIMINATION
  ============================================================ */
  {
    id: 'fha-protected-classes',
    title: 'Fair Housing Act — Federal Protected Classes',
    category: 'fair-housing',
    trigger: ['discrimination', 'denied_housing', 'voucher_discrimination', 'disability_barrier'],
    summary: 'Federal law prohibits housing discrimination based on race, color, national origin, religion, sex, familial status, and disability.',
    details: `The Fair Housing Act (42 U.S.C. § 3604) prohibits discrimination in the sale, rental, and financing of housing based on:
• Race, color
• National origin
• Religion
• Sex (including sexual harassment)
• Familial status (families with children under 18)
• Disability (mental and physical)

Washington State adds additional protected classes under RCW 49.60, including:
• Source of income (including housing vouchers)
• Sexual orientation
• Gender identity
• Marital status
• Age (40+)
• Honorably discharged veteran status
• Use of a service or assistance animal

King County and Seattle may have additional local protections.

Filing a complaint: You can file with HUD (within 1 year), the WA Human Rights Commission (within 1 year), or in court (within 2 years) — Needs Verification.`,
    whatToDoc: [
      'Save all written communications with the landlord or housing provider',
      'Note exact dates, what was said, and who said it',
      'Save copies of denials and reasons given',
      'Keep any written application or screening criteria provided',
    ],
    contacts: ['Washington State Human Rights Commission', 'Fair Housing Center of Washington', 'HUD FHEO', 'Northwest Justice Project'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Filing deadlines and exact protected classes under state law should be verified with a fair housing attorney or agency.',
    source: 'Fair Housing Act 42 U.S.C. § 3604; RCW 49.60',
    lawCitation: 'Fair Housing Act; RCW 49.60',
  },
  {
    id: 'source-of-income',
    title: 'Source of Income — Voucher Holder Protections (Washington & Seattle)',
    category: 'fair-housing',
    trigger: ['voucher_discrimination', 'section8_refused', 'voucher_holder'],
    summary: 'Washington State law prohibits landlords from refusing to accept housing vouchers (Section 8 / HCV) as a source of income in most cases.',
    details: `Washington State (RCW 49.60) includes "source of income" as a protected class under the Washington Law Against Discrimination, which means landlords generally cannot refuse to rent to someone solely because they use a housing voucher.

Seattle has a stronger local law that more explicitly requires landlords to accept vouchers (subject to certain exceptions — Needs Verification).

If a landlord tells you "we don't accept Section 8" or refuses to complete the required paperwork, this may be illegal discrimination.

Note: Landlords may still apply standard rental criteria (income, credit, background), but refusing solely because of the voucher is prohibited.`,
    whatToDoc: [
      'Save any written or email communication where landlord refuses voucher',
      'Note exact words used and date of refusal',
      'If possible, get the refusal in writing',
    ],
    contacts: ['Washington State Human Rights Commission', 'Fair Housing Center of Washington', 'Tenants Union of Washington State'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Source of income protection scope and exceptions have evolved. Verify current Washington and Seattle provisions.',
    source: 'RCW 49.60.030; Seattle Fair Chance Housing Ordinance',
    lawCitation: 'RCW 49.60.030',
  },

  /* ============================================================
     DISABILITY ACCOMMODATIONS
  ============================================================ */
  {
    id: 'reasonable-accommodation',
    title: 'Reasonable Accommodation Rights — Disability',
    category: 'disability',
    trigger: ['disability_barrier', 'accommodation_needed', 'accommodation_denied'],
    summary: 'Under the Fair Housing Act and Washington law, landlords must make reasonable accommodations for tenants with disabilities unless doing so causes undue hardship.',
    details: `What is a reasonable accommodation?
A change in rules, policies, practices, or services to allow a person with a disability to use and enjoy their housing.

Examples:
• Allowing a service or emotional support animal even if pets are prohibited
• Allowing a reserved accessible parking space
• Allowing modifications to the unit (tenant may pay for modifications)
• Waiving a no-guest policy for a live-in caregiver
• Agreeing to accept rent payment by a third party
• Granting additional time to cure a lease violation due to disability

How to request:
• Submit a written request to your landlord
• You do not have to use the words "reasonable accommodation"
• You may need to provide documentation from a healthcare provider (but landlords cannot require specific forms or demand detailed medical records)
• Landlord must respond in a reasonable time

If denied:
• Ask for the denial in writing
• File a complaint with WA Human Rights Commission or HUD
• Contact legal aid`,
    whatToDoc: [
      'Submit your accommodation request in writing — keep a copy',
      'Get a letter from your healthcare provider if needed',
      'Document the landlord\'s response and timeline',
      'If denied, get the denial in writing',
    ],
    contacts: ['Washington State Human Rights Commission', 'Fair Housing Center of Washington', 'Northwest Justice Project'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Verify current FHA reasonable accommodation standards and what documentation landlords can legally require.',
    source: 'Fair Housing Act 42 U.S.C. § 3604(f); RCW 49.60',
    lawCitation: 'FHA 42 U.S.C. § 3604(f)',
  },

  /* ============================================================
     VAWA — DOMESTIC VIOLENCE HOUSING PROTECTIONS
  ============================================================ */
  {
    id: 'vawa-housing',
    title: 'VAWA Housing Protections — Domestic Violence Survivors',
    category: 'safety',
    trigger: ['domestic_violence', 'fleeing_safety', 'dv_eviction_risk'],
    summary: 'The Violence Against Women Act (VAWA) provides housing protections for survivors of domestic violence, sexual assault, stalking, or dating violence in federally-assisted housing.',
    details: `VAWA applies to tenants in federally-subsidized housing (public housing, Section 8/HCV vouchers, HUD-assisted properties) and gives:

• Protection from eviction or denial of housing solely because of DV victim status
• Right to transfer your housing assistance to a new unit for safety (Emergency Transfer)
• Protection of your confidentiality — providers cannot share your status without consent
• Right to documentation of your situation (self-certification is often acceptable)

VAWA also protects you if:
• Your abuser committed a lease violation — you generally cannot be evicted for their actions if you can document the DV

Limitations:
• VAWA protections apply to federally-assisted housing — may not apply to all private rentals
• You may still be subject to eviction for your own serious lease violations unrelated to DV

What to do:
1. Let your housing provider know you need VAWA protections (they must provide you with a notice of rights)
2. Complete a VAWA self-certification form if asked
3. Request an Emergency Transfer if needed for safety`,
    whatToDoc: [
      'Document the domestic violence (police reports, protective orders, medical records, or self-certification)',
      'Request VAWA notification of rights from your housing provider',
      'Keep documentation confidential — be careful who you share it with',
    ],
    contacts: ['YWCA Seattle | King | Snohomish', 'DAWN', 'Northwest Justice Project'],
    urgency: 'high',
    needsVerification: true,
    verifyNote: 'VAWA housing provisions have been updated by the Consolidated Appropriations Act. Verify current VAWA housing protections and applicability.',
    source: 'Violence Against Women Act, 34 U.S.C. § 12491',
    lawCitation: 'VAWA 34 U.S.C. § 12491',
  },

  /* ============================================================
     CHILDREN — McKINNEY-VENTO
  ============================================================ */
  {
    id: 'mckinney-vento',
    title: 'McKinney-Vento — School Rights for Homeless Children',
    category: 'family',
    trigger: ['has_children', 'homeless', 'housing_instability', 'eviction_risk'],
    summary: 'Children experiencing homelessness have federally-protected rights to stay in their school, get transportation, and enroll without typical documentation requirements.',
    details: `Under the McKinney-Vento Homeless Assistance Act (42 U.S.C. § 11431), children who are homeless have the right to:

• Stay enrolled in their "school of origin" (the school they attended before becoming homeless) or enroll in the school where they are temporarily staying
• Immediate enrollment even without proof of residency, school records, immunization records, or IDs
• Free transportation to their school of origin
• Access to Title I services and other academic supports
• Protection from segregation based on homeless status

"Homeless" under McKinney-Vento includes children who are:
• Living in a shelter, motel, car, or on the street
• Sharing housing temporarily due to economic hardship (doubled-up)
• Awaiting placement in foster care

Every school district must have a McKinney-Vento liaison — contact them if your child's school creates barriers.`,
    whatToDoc: [
      'Note your child\'s current school of origin',
      'Contact the school district\'s McKinney-Vento liaison',
      'School must enroll your child immediately — document any delays or denials',
    ],
    contacts: ['Your school district McKinney-Vento liaison', 'Northwest Justice Project'],
    urgency: 'medium',
    needsVerification: false,
    source: 'McKinney-Vento Homeless Assistance Act, 42 U.S.C. § 11431',
    lawCitation: '42 U.S.C. § 11431',
  },

  /* ============================================================
     SECTION 8 VOUCHER RIGHTS
  ============================================================ */
  {
    id: 'voucher-rights',
    title: 'Housing Choice Voucher (Section 8) Tenant Rights',
    category: 'voucher',
    trigger: ['has_voucher', 'voucher_expired', 'voucher_terminated', 'voucher_deadline'],
    summary: 'Housing voucher holders have rights including due process before termination of assistance, the right to appeal, and extension request rights.',
    details: `Key voucher holder rights:
• Right to a hearing before your housing authority terminates your voucher
• Right to request an extension of your voucher search time if you are unable to find housing (extensions are not guaranteed but can be granted)
• Right to use your voucher anywhere in the country after initial leasing period ("portability")
• Right to request an exception payment standard if your disability requires accessibility features that add cost
• Right to reasonable accommodation if your disability affects your ability to comply with voucher requirements

If your voucher is being terminated:
1. Request a hearing in writing IMMEDIATELY — deadlines are strict
2. Contact legal aid (Northwest Justice Project) before the hearing`,
    whatToDoc: [
      'Keep all notices from your housing authority',
      'Note deadlines for requesting hearings',
      'Request hearing in writing and keep a copy with proof of submission',
      'Track your voucher expiration date and request extension early if needed',
    ],
    contacts: ['King County Housing Authority', 'Seattle Housing Authority', 'Northwest Justice Project'],
    urgency: 'high',
    needsVerification: true,
    verifyNote: 'Voucher hearing rights, deadlines, and extension procedures are governed by federal regulations and housing authority policy — verify current procedures with your housing authority.',
    source: '24 C.F.R. Part 982; HUD Notice PIH',
    lawCitation: '24 C.F.R. Part 982',
  },

  /* ============================================================
     CRIMINAL BACKGROUND — FAIR CHANCE
  ============================================================ */
  {
    id: 'fair-chance-housing',
    title: 'Fair Chance Housing — Criminal Background Screening Protections',
    category: 'fair-housing',
    trigger: ['criminal_background', 'denied_for_background'],
    summary: 'Seattle has a Fair Chance Housing Ordinance that restricts how landlords can use criminal history in housing decisions.',
    details: `Seattle's Fair Chance Housing Ordinance (Seattle Municipal Code 14.09) generally prohibits landlords in Seattle from:
• Asking about criminal history before making a conditional offer of housing
• Automatically rejecting applicants because of any arrest or criminal history
• Using certain types of criminal history at all (e.g., arrests that did not result in convictions, sealed/vacated records)

Washington State also provides some protections around sealed and vacated records.

Under Seattle's ordinance, landlords must:
• Make a conditional offer before running a background check
• Conduct an individualized assessment before rejecting based on criminal history
• Consider factors like the nature of the offense, time elapsed, and evidence of rehabilitation

Important: This rule applies within Seattle city limits. Other King County cities may not have these protections.`,
    whatToDoc: [
      'Note whether the landlord asked about criminal history before making an offer',
      'Save all written communications about the application and denial',
      'Request a written explanation of any denial based on criminal history',
    ],
    contacts: ['Tenants Union of Washington State', 'Fair Housing Center of Washington', 'Northwest Justice Project'],
    urgency: 'medium',
    needsVerification: true,
    verifyNote: 'Seattle Fair Chance Housing Ordinance has been updated. Verify current provisions, exceptions, and enforcement.',
    source: 'Seattle Municipal Code 14.09',
    lawCitation: 'SMC 14.09',
    citySpecific: 'Seattle',
  },
];

export function getRightsByTrigger(triggers) {
  return rights.filter(r =>
    r.trigger.some(t => triggers.includes(t))
  );
}

export function getRightsByCategory(category) {
  return rights.filter(r => r.category === category);
}

export function getUrgentRights(triggers) {
  return getRightsByTrigger(triggers).filter(r => r.urgency === 'high');
}

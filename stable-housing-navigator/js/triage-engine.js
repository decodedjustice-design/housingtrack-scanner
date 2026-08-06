/**
 * Triage Engine — Stable Housing Navigator
 * Drives the step-by-step assessment flow.
 * Detects urgency, barriers, and generates initial action plan.
 */

export const URGENCY = {
  CRISIS: 'crisis',
  URGENT: 'urgent',
  MODERATE: 'moderate',
  PLANNING: 'planning',
};

export const BARRIERS = {
  EVICTION_HISTORY: 'eviction_history',
  RENTAL_DEBT: 'rental_debt',
  CRIMINAL_BACKGROUND: 'criminal_background',
  CREDIT_ISSUES: 'credit_issues',
  NO_INCOME: 'no_income',
  LOW_INCOME: 'low_income',
  VOUCHER_DISCRIMINATION: 'voucher_discrimination',
  DISABILITY_BARRIER: 'disability_barrier',
  MISSING_ID: 'missing_id',
  MISSING_DOCS: 'missing_documents',
  UTILITY_ARREARS: 'utility_arrears',
  FAMILY_SIZE_MISMATCH: 'family_size_mismatch',
  TRANSPORTATION: 'transportation_barrier',
  CHILDCARE: 'childcare_barrier',
  DOMESTIC_VIOLENCE: 'domestic_violence',
  LANGUAGE_BARRIER: 'language_barrier',
  OVERWHELM: 'overwhelm',
  UNSAFE_HOUSING: 'unsafe_housing',
};

export const PATHWAYS = {
  CRISIS_SHELTER: 'crisis_shelter',
  DV_SAFETY: 'dv_safety',
  EVICTION_DEFENSE: 'eviction_defense',
  VOUCHER_SEARCH: 'voucher_search',
  AFFORDABLE_HOUSING: 'affordable_housing',
  UTILITY_CRISIS: 'utility_crisis',
  BARRIER_REMOVAL: 'barrier_removal',
  STABILIZATION: 'stabilization',
};

// Triage questions — ordered by urgency detection
export const triageQuestions = [
  {
    id: 'safety',
    step: 1,
    question: 'Are you in immediate danger or do you need to leave your home right now for safety?',
    subtext: 'This includes domestic violence, threats, or an unsafe living situation.',
    type: 'radio',
    options: [
      { value: 'yes_danger', label: 'Yes — I need safety help right now', urgency: URGENCY.CRISIS, pathway: PATHWAYS.DV_SAFETY, flags: [BARRIERS.DOMESTIC_VIOLENCE] },
      { value: 'leaving_soon', label: 'I may need to leave soon for safety', urgency: URGENCY.URGENT, flags: [BARRIERS.DOMESTIC_VIOLENCE, BARRIERS.UNSAFE_HOUSING] },
      { value: 'unsafe_housing', label: 'My housing is unsafe (not violence-related)', urgency: URGENCY.URGENT, flags: [BARRIERS.UNSAFE_HOUSING] },
      { value: 'no', label: 'No, I am not in immediate danger', urgency: null },
    ],
  },
  {
    id: 'housing_status',
    step: 2,
    question: 'What is your current housing situation?',
    subtext: 'Choose the option that best describes where you are right now.',
    type: 'radio',
    options: [
      { value: 'homeless_outside', label: 'I have no place to sleep tonight (outside or in a car)', urgency: URGENCY.CRISIS, pathway: PATHWAYS.CRISIS_SHELTER },
      { value: 'shelter', label: 'I am staying in a shelter or emergency housing', urgency: URGENCY.URGENT },
      { value: 'doubled_up', label: 'I am staying with family or friends (not my own place)', urgency: URGENCY.URGENT },
      { value: 'motel', label: 'I am staying in a motel, hotel, or transitional housing', urgency: URGENCY.URGENT },
      { value: 'renting_at_risk', label: 'I have a home but am at risk of losing it', urgency: URGENCY.URGENT },
      { value: 'renting_stable', label: 'I have housing and am not in immediate risk', urgency: URGENCY.MODERATE },
      { value: 'looking', label: 'I am looking for housing but not currently in crisis', urgency: URGENCY.PLANNING },
    ],
  },
  {
    id: 'eviction',
    step: 3,
    question: 'Have you received any eviction-related notices or court papers?',
    subtext: 'This includes pay-or-vacate notices, comply-or-vacate notices, or summons to eviction court.',
    type: 'radio',
    options: [
      { value: 'court_date', label: 'Yes — I have an eviction court date', urgency: URGENCY.CRISIS, pathway: PATHWAYS.EVICTION_DEFENSE, flags: ['eviction_notice', 'eviction_served'] },
      { value: 'notice_served', label: 'Yes — I received a notice but no court date yet', urgency: URGENCY.URGENT, pathway: PATHWAYS.EVICTION_DEFENSE, flags: ['eviction_notice'] },
      { value: 'verbal_warning', label: 'My landlord has threatened eviction but not in writing', urgency: URGENCY.URGENT },
      { value: 'no', label: 'No eviction notices', urgency: null },
    ],
  },
  {
    id: 'rent_behind',
    step: 4,
    question: 'Are you behind on rent?',
    subtext: 'If yes, how many months?',
    type: 'radio',
    options: [
      { value: 'yes_3plus', label: 'Yes — 3 or more months behind', urgency: URGENCY.URGENT, flags: [BARRIERS.RENTAL_DEBT] },
      { value: 'yes_1to2', label: 'Yes — 1 to 2 months behind', urgency: URGENCY.URGENT, flags: [BARRIERS.RENTAL_DEBT] },
      { value: 'partial', label: 'I can pay some but not all of this month\'s rent', urgency: URGENCY.MODERATE, flags: [BARRIERS.RENTAL_DEBT] },
      { value: 'current', label: 'I am current on rent', urgency: null },
      { value: 'na', label: 'Not applicable (no rental housing)', urgency: null },
    ],
  },
  {
    id: 'utility_crisis',
    step: 5,
    question: 'Are you facing a utility shutoff or do you have past-due utility bills?',
    type: 'radio',
    options: [
      { value: 'shutoff_notice', label: 'Yes — I have received a shutoff notice', urgency: URGENCY.URGENT, pathway: PATHWAYS.UTILITY_CRISIS, flags: [BARRIERS.UTILITY_ARREARS] },
      { value: 'behind_utilities', label: 'Yes — I am behind on utilities but no shutoff notice', urgency: URGENCY.MODERATE, flags: [BARRIERS.UTILITY_ARREARS] },
      { value: 'no', label: 'No utility problems', urgency: null },
    ],
  },
  {
    id: 'children',
    step: 6,
    question: 'Do you have children under 18 living with you or in your care?',
    type: 'radio',
    options: [
      { value: 'yes_minor', label: 'Yes, minor children in my household', flags: [] },
      { value: 'yes_sometimes', label: 'My children stay with me part-time', flags: [] },
      { value: 'no', label: 'No children in the household', flags: [] },
    ],
    saveAs: 'hasChildren',
  },
  {
    id: 'disability',
    step: 7,
    question: 'Do you or anyone in your household have a disability that affects your housing situation?',
    subtext: 'This includes physical, mental health, developmental, or other disabilities. You do not need to share details here.',
    type: 'radio',
    options: [
      { value: 'yes_affects_housing', label: 'Yes — and it affects my housing search or situation', flags: [BARRIERS.DISABILITY_BARRIER] },
      { value: 'yes_accommodation', label: 'Yes — and I may need a housing accommodation', flags: [BARRIERS.DISABILITY_BARRIER] },
      { value: 'yes_no_housing_impact', label: 'Yes — but it doesn\'t affect my housing currently', flags: [] },
      { value: 'no', label: 'No', flags: [] },
      { value: 'prefer_not', label: 'Prefer not to say', flags: [] },
    ],
    saveAs: 'hasDisability',
  },
  {
    id: 'barriers',
    step: 8,
    question: 'What barriers are you facing in finding or keeping housing?',
    subtext: 'Select all that apply. Every barrier has options — none of these mean you can\'t be helped.',
    type: 'checkbox',
    options: [
      { value: BARRIERS.EVICTION_HISTORY, label: 'Past eviction on my record', desc: 'A previous eviction appearing in background checks' },
      { value: BARRIERS.CRIMINAL_BACKGROUND, label: 'Criminal background', desc: 'A prior arrest, charge, or conviction' },
      { value: BARRIERS.CREDIT_ISSUES, label: 'Credit problems', desc: 'Poor credit score or collections history' },
      { value: BARRIERS.RENTAL_DEBT, label: 'Unpaid rent or rental debt', desc: 'Money owed to a past landlord or in collections' },
      { value: BARRIERS.NO_INCOME, label: 'No income currently', desc: 'Not currently employed or receiving benefits' },
      { value: BARRIERS.LOW_INCOME, label: 'Income is too low for market rents', desc: 'Working or receiving benefits but can\'t afford current rents' },
      { value: BARRIERS.MISSING_ID, label: 'Missing ID or key documents', desc: 'No state ID, birth certificate, Social Security card, or similar' },
      { value: BARRIERS.VOUCHER_DISCRIMINATION, label: 'Landlords refuse to accept my voucher', desc: 'Being told "we don\'t accept Section 8"' },
      { value: BARRIERS.UTILITY_ARREARS, label: 'Utility debt', desc: 'Owe money to a utility company' },
      { value: BARRIERS.FAMILY_SIZE_MISMATCH, label: 'Can\'t find housing big enough for my family', desc: 'Family size makes affordable units hard to find' },
      { value: BARRIERS.LANGUAGE_BARRIER, label: 'Language or communication access', desc: 'Navigating systems in English is difficult' },
      { value: BARRIERS.OVERWHELM, label: 'Overwhelmed by the process', desc: 'The paperwork and phone calls feel impossible to manage' },
    ],
  },
  {
    id: 'voucher',
    step: 9,
    question: 'Do you currently have a housing voucher (Section 8 or other rental assistance voucher)?',
    type: 'radio',
    options: [
      { value: 'yes_active', label: 'Yes — my voucher is active and I\'m looking for housing', pathway: PATHWAYS.VOUCHER_SEARCH },
      { value: 'yes_expiring', label: 'Yes — my voucher is expiring soon', pathway: PATHWAYS.VOUCHER_SEARCH, urgency: URGENCY.URGENT },
      { value: 'yes_in_unit', label: 'Yes — I\'m in a unit with a voucher', },
      { value: 'applied', label: 'I\'ve applied for a voucher but don\'t have one yet' },
      { value: 'no', label: 'No voucher' },
      { value: 'not_sure', label: 'I\'m not sure' },
    ],
    saveAs: 'hasVoucher',
  },
  {
    id: 'support',
    step: 10,
    question: 'What additional support would help you most right now?',
    subtext: 'Select all that apply.',
    type: 'checkbox',
    options: [
      { value: 'legal_help', label: 'Legal help or advice' },
      { value: 'rental_assistance', label: 'Money for rent' },
      { value: 'utility_help', label: 'Help with utility bills' },
      { value: 'housing_applications', label: 'Help applying for affordable housing' },
      { value: 'documents', label: 'Help getting documents together' },
      { value: 'caseworker', label: 'A case manager to help navigate everything' },
      { value: 'childcare', label: 'Childcare' },
      { value: 'food', label: 'Food or basic needs' },
      { value: 'mental_health', label: 'Mental health or counseling support' },
      { value: 'transportation', label: 'Transportation' },
      { value: 'benefits', label: 'Help applying for benefits (SNAP, TANF, Medicaid)' },
    ],
  },
];

/**
 * Determine the overall urgency level from triage answers.
 */
export function calculateUrgency(answers) {
  const crisisIndicators = [
    answers.safety === 'yes_danger',
    answers.housing_status === 'homeless_outside',
    answers.eviction === 'court_date',
    answers.utility_crisis === 'shutoff_notice' && answers.eviction === 'court_date',
  ];

  const urgentIndicators = [
    answers.safety === 'leaving_soon',
    answers.housing_status === 'shelter',
    answers.housing_status === 'doubled_up',
    answers.housing_status === 'motel',
    answers.eviction === 'notice_served',
    answers.rent_behind === 'yes_3plus',
    answers.utility_crisis === 'shutoff_notice',
    answers.voucher === 'yes_expiring',
  ];

  if (crisisIndicators.some(Boolean)) return URGENCY.CRISIS;
  if (urgentIndicators.some(Boolean)) return URGENCY.URGENT;
  if (answers.rent_behind === 'yes_1to2' || answers.rent_behind === 'partial') return URGENCY.MODERATE;
  return URGENCY.PLANNING;
}

/**
 * Extract all flagged barriers from triage answers.
 */
export function extractBarriers(answers) {
  const barriers = new Set();

  // Explicit barrier checkbox selections
  if (Array.isArray(answers.barriers)) {
    answers.barriers.forEach(b => barriers.add(b));
  }

  // Inferred barriers from other questions
  if (answers.safety === 'yes_danger' || answers.safety === 'leaving_soon') {
    barriers.add(BARRIERS.DOMESTIC_VIOLENCE);
  }
  if (answers.safety === 'unsafe_housing') {
    barriers.add(BARRIERS.UNSAFE_HOUSING);
  }
  if (answers.rent_behind && answers.rent_behind !== 'current' && answers.rent_behind !== 'na') {
    barriers.add(BARRIERS.RENTAL_DEBT);
  }
  if (answers.utility_crisis && answers.utility_crisis !== 'no') {
    barriers.add(BARRIERS.UTILITY_ARREARS);
  }
  if (answers.disability && answers.disability.startsWith('yes')) {
    barriers.add(BARRIERS.DISABILITY_BARRIER);
  }

  return Array.from(barriers);
}

/**
 * Determine the primary pathway.
 */
export function determinePrimaryPathway(answers, urgency) {
  if (answers.safety === 'yes_danger' || answers.safety === 'leaving_soon') {
    return PATHWAYS.DV_SAFETY;
  }
  if (answers.housing_status === 'homeless_outside' || answers.housing_status === 'shelter') {
    return PATHWAYS.CRISIS_SHELTER;
  }
  if (answers.eviction === 'court_date' || answers.eviction === 'notice_served') {
    return PATHWAYS.EVICTION_DEFENSE;
  }
  if (answers.voucher === 'yes_active' || answers.voucher === 'yes_expiring') {
    return PATHWAYS.VOUCHER_SEARCH;
  }
  if (answers.utility_crisis === 'shutoff_notice') {
    return PATHWAYS.UTILITY_CRISIS;
  }
  const barriers = extractBarriers(answers);
  if (barriers.length >= 3) return PATHWAYS.BARRIER_REMOVAL;
  return PATHWAYS.STABILIZATION;
}

/**
 * Generate immediate action steps based on urgency and pathway.
 */
export function generateImmediateActions(urgency, pathway, barriers, answers) {
  const actions = [];

  const add = (action) => actions.push(action);

  // DV Safety
  if (pathway === PATHWAYS.DV_SAFETY) {
    add({ id: 'dv1', title: 'Call the 24-hour crisis line now', desc: 'DAWN: 425-656-8423 | WA State DV Hotline: 1-800-562-6025 | National: 1-800-799-7233', deadline: 'TODAY', urgency: 'urgent', category: 'safety', link: null });
    add({ id: 'dv2', title: 'Call 211 to find emergency shelter', desc: 'Tell them you need DV emergency housing. They can find available beds.', deadline: 'TODAY', urgency: 'urgent', category: 'safety' });
    add({ id: 'dv3', title: 'Safety plan with an advocate', desc: 'A DV advocate can help you plan your exit and protect your children safely.', deadline: 'TODAY', urgency: 'urgent', category: 'safety' });
  }

  // Crisis Shelter
  if (pathway === PATHWAYS.CRISIS_SHELTER) {
    add({ id: 'sh1', title: 'Call 211 right now for emergency shelter', desc: 'Available 24/7. Tell them you need somewhere to sleep tonight.', deadline: 'TODAY', urgency: 'urgent', category: 'shelter' });
    add({ id: 'sh2', title: 'Contact King County Coordinated Entry', desc: 'This is the entry point for King County\'s housing programs. Call 211 to reach them.', deadline: 'This week', urgency: 'urgent', category: 'housing' });
  }

  // Eviction Defense
  if (pathway === PATHWAYS.EVICTION_DEFENSE) {
    add({ id: 'ev1', title: 'Call Northwest Justice Project immediately', desc: '1-888-201-1014 — Free legal help. Call TODAY if you have a court date.', deadline: answers.eviction === 'court_date' ? 'TODAY' : 'Within 48 hours', urgency: 'urgent', category: 'legal' });
    add({ id: 'ev2', title: 'Do NOT ignore the notice or throw it away', desc: 'Keep all notices. The dates on the notice are legally important.', deadline: 'Right now', urgency: 'urgent', category: 'legal' });
    add({ id: 'ev3', title: 'Apply for rental assistance immediately', desc: 'Call 211 and ask specifically about emergency rental assistance for eviction prevention.', deadline: 'TODAY', urgency: 'urgent', category: 'rental-assistance' });
    add({ id: 'ev4', title: 'Contact the Tenants Union', desc: '206-723-0500 — Free tenant rights counseling.', deadline: 'Within 24 hours', urgency: 'urgent', category: 'legal' });
  }

  // Voucher Search
  if (pathway === PATHWAYS.VOUCHER_SEARCH) {
    add({ id: 'vo1', title: 'Check your voucher expiration date today', desc: 'If your voucher is expiring, request an extension in writing immediately.', deadline: 'TODAY', urgency: 'urgent', category: 'voucher' });
    add({ id: 'vo2', title: 'Contact your housing authority about search support', desc: 'Ask about their housing search assistance, inspections, and voucher briefings.', deadline: 'This week', urgency: 'soon', category: 'voucher' });
    add({ id: 'vo3', title: 'Start tracking every unit you apply to', desc: 'Use the Application Tracker in your dashboard to document your search.', deadline: 'Ongoing', urgency: 'normal', category: 'housing' });
  }

  // Utility Crisis
  if (pathway === PATHWAYS.UTILITY_CRISIS) {
    add({ id: 'ut1', title: 'Call your utility company TODAY', desc: 'Ask for a payment arrangement, hardship extension, or assistance program. They cannot shut you off without notice.', deadline: 'TODAY', urgency: 'urgent', category: 'utilities' });
    add({ id: 'ut2', title: 'Apply for LIHEAP/utility assistance through 211', desc: 'Call 211 and say "I have a utility shutoff notice." They may have emergency funds.', deadline: 'TODAY', urgency: 'urgent', category: 'utilities' });
  }

  // Universal actions
  add({ id: 'gen1', title: 'Call 211 for a resource specialist', desc: 'Free, confidential. They know what is open TODAY in your area.', deadline: 'This week', urgency: 'normal', category: 'referral' });

  if (barriers.includes(BARRIERS.MISSING_ID)) {
    add({ id: 'doc1', title: 'Get help obtaining ID', desc: 'Call 211 and ask about ID assistance programs. Many services require ID.', deadline: 'This week', urgency: 'soon', category: 'documents' });
  }

  if (answers.children === 'yes_minor' || answers.children === 'yes_sometimes') {
    add({ id: 'ch1', title: 'Contact your child\'s school McKinney-Vento liaison', desc: 'Your child has the right to stay in their school even if housing changes. The school district must help.', deadline: 'This week', urgency: 'soon', category: 'family' });
  }

  return actions;
}

/**
 * Generate right triggers based on answers and barriers.
 */
export function generateRightTriggers(answers, barriers) {
  const triggers = [];

  if (answers.eviction === 'court_date' || answers.eviction === 'notice_served') {
    triggers.push('eviction_notice', 'eviction_served');
  }
  if (answers.safety === 'yes_danger' || answers.safety === 'leaving_soon') {
    triggers.push('domestic_violence', 'fleeing_safety');
  }
  if (barriers.includes(BARRIERS.DISABILITY_BARRIER)) {
    triggers.push('disability_barrier', 'accommodation_needed');
  }
  if (barriers.includes(BARRIERS.VOUCHER_DISCRIMINATION)) {
    triggers.push('voucher_discrimination', 'voucher_holder');
  }
  if (barriers.includes(BARRIERS.CRIMINAL_BACKGROUND)) {
    triggers.push('criminal_background', 'denied_for_background');
  }
  if (answers.voucher && answers.voucher !== 'no' && answers.voucher !== 'not_sure') {
    triggers.push('has_voucher', 'voucher_holder');
  }
  if (answers.children === 'yes_minor') {
    triggers.push('has_children');
    if (answers.housing_status !== 'renting_stable') {
      triggers.push('homeless');
    }
  }
  if (answers.housing_status === 'unsafe_housing' || answers.safety === 'unsafe_housing') {
    triggers.push('unsafe_housing', 'repairs_needed');
  }

  return [...new Set(triggers)];
}

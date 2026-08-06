/**
 * Stable Housing Navigator — Session & Local Storage Manager
 * Privacy-first: all data stays on device, never sent to server.
 */

const STORAGE_KEY = 'shn_session';
const VERSION = '1.0';

const defaultSession = {
  version: VERSION,
  createdAt: null,
  updatedAt: null,
  profile: {
    firstName: '',
    householdSize: null,
    hasChildren: null,
    childrenAges: [],
    hasDisability: null,
    disabilityTypes: [],
    fleeSafety: null,
    primaryLanguage: 'English',
    zipCode: '',
    currentCity: '',
    housingStatus: '',
    monthlyIncome: null,
    incomeSource: '',
    hasVoucher: null,
    voucherType: '',
    voucherExpiry: '',
  },
  triage: {
    completed: false,
    urgencyLevel: null, // 'crisis' | 'urgent' | 'moderate' | 'planning'
    urgentFlags: [],
    barriers: [],
    pathway: null,
    completedAt: null,
  },
  plan: {
    actions: [],
    deadlines: [],
    backupPlans: [],
    generatedAt: null,
  },
  applications: [],
  documents: [],
  contacts: [],
  letters: [],
  checkIns: [],
  rightsTriggers: [],
};

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSession();
    const data = JSON.parse(raw);
    if (data.version !== VERSION) {
      return migrateSession(data);
    }
    return data;
  } catch (e) {
    return createSession();
  }
}

export function saveSession(data) {
  try {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Storage save failed:', e);
    return false;
  }
}

export function updateProfile(fields) {
  const session = getSession();
  session.profile = { ...session.profile, ...fields };
  saveSession(session);
  return session;
}

export function updateTriage(fields) {
  const session = getSession();
  session.triage = { ...session.triage, ...fields };
  saveSession(session);
  return session;
}

export function addAction(action) {
  const session = getSession();
  const newAction = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    completed: false,
    ...action,
  };
  session.plan.actions.push(newAction);
  saveSession(session);
  return newAction;
}

export function toggleAction(actionId) {
  const session = getSession();
  const action = session.plan.actions.find(a => a.id === actionId);
  if (action) {
    action.completed = !action.completed;
    action.completedAt = action.completed ? new Date().toISOString() : null;
    saveSession(session);
  }
  return session;
}

export function addDocument(doc) {
  const session = getSession();
  const newDoc = {
    id: generateId(),
    uploadedAt: new Date().toISOString(),
    ...doc,
  };
  session.documents.push(newDoc);
  saveSession(session);
  return newDoc;
}

export function addApplication(app) {
  const session = getSession();
  const newApp = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    ...app,
  };
  session.applications.push(newApp);
  saveSession(session);
  return newApp;
}

export function addContact(contact) {
  const session = getSession();
  const newContact = {
    id: generateId(),
    addedAt: new Date().toISOString(),
    ...contact,
  };
  session.contacts.push(newContact);
  saveSession(session);
  return newContact;
}

export function saveLetter(letter) {
  const session = getSession();
  const newLetter = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...letter,
  };
  session.letters.push(newLetter);
  saveSession(session);
  return newLetter;
}

export function addCheckIn(note) {
  const session = getSession();
  const checkIn = {
    id: generateId(),
    date: new Date().toISOString(),
    note,
  };
  session.checkIns.push(checkIn);
  saveSession(session);
  return checkIn;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportSession() {
  const session = getSession();
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `housing-plan-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function createSession() {
  const session = JSON.parse(JSON.stringify(defaultSession));
  session.createdAt = new Date().toISOString();
  session.updatedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

function migrateSession(old) {
  const session = JSON.parse(JSON.stringify(defaultSession));
  session.createdAt = old.createdAt || new Date().toISOString();
  if (old.profile) session.profile = { ...session.profile, ...old.profile };
  saveSession(session);
  return session;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export function getBarrierSummary(barriers) {
  const groups = {
    financial: ['rental_debt', 'no_income', 'low_income', 'utility_arrears', 'credit_issues'],
    legal: ['eviction_history', 'criminal_background'],
    documentation: ['missing_id', 'missing_documents'],
    discrimination: ['voucher_discrimination', 'source_income_discrimination'],
    disability: ['disability_barrier', 'accommodation_denied'],
    safety: ['domestic_violence', 'unsafe_housing'],
    family: ['family_size_mismatch', 'childcare_barrier'],
    access: ['language_barrier', 'transportation_barrier', 'overwhelm'],
  };

  const score = barriers.length;
  let severity = 'low';
  if (score >= 4) severity = 'high';
  else if (score >= 2) severity = 'moderate';

  const activeGroups = Object.entries(groups)
    .filter(([, codes]) => codes.some(c => barriers.includes(c)))
    .map(([group]) => group);

  return { score, severity, activeGroups };
}

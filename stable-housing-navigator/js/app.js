/**
 * Stable Housing Navigator — Core Application JS
 * Handles navigation, modals, toasts, shared UI behavior.
 */

// ----------------------------------------------------------------
// Navigation — active state, mobile menu
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTabs();
  initChoiceCards();
  initTooltips();
  setCurrentYear();
});

function initNav() {
  // Mark active nav link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Mobile menu toggle
  const toggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const isOpen = mobileMenu.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });
  }
}

function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabContainer => {
    const buttons = tabContainer.querySelectorAll('.tab-btn');
    const panels = tabContainer.closest('.tabs-wrapper')?.querySelectorAll('.tab-panel') ||
      tabContainer.parentElement.querySelectorAll('.tab-panel');

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  });
}

function initChoiceCards() {
  document.querySelectorAll('.choice-card').forEach(card => {
    const input = card.querySelector('input[type="radio"], input[type="checkbox"]');
    if (!input) return;

    card.addEventListener('click', (e) => {
      if (e.target === input) return;

      if (input.type === 'radio') {
        const name = input.name;
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
          r.closest('.choice-card')?.classList.remove('selected');
        });
        input.checked = true;
        card.classList.add('selected');
      } else {
        input.checked = !input.checked;
        card.classList.toggle('selected', input.checked);
      }

      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    input.addEventListener('change', () => {
      if (input.type === 'checkbox') {
        card.classList.toggle('selected', input.checked);
      }
    });
  });
}

function initTooltips() {
  // Simple title-based tooltips handled via CSS / native browser
}

function setCurrentYear() {
  const el = document.getElementById('currentYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ----------------------------------------------------------------
// Toast Notifications
// ----------------------------------------------------------------
export function showToast(message, type = 'default', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ----------------------------------------------------------------
// Modal helpers
// ----------------------------------------------------------------
export function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.add('open');
    overlay.querySelector('[data-focus-first]')?.focus();
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close modals on overlay click or ESC
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      closeModal(m.id);
    });
  }
});

// ----------------------------------------------------------------
// Safety Exit
// ----------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  // Triple-escape to quick exit
  if (e.key === 'Escape') {
    const exitBtn = document.getElementById('safetyExit');
    if (exitBtn) {
      exitBtn._escCount = (exitBtn._escCount || 0) + 1;
      if (exitBtn._escCount >= 3) {
        window.location.href = 'https://weather.com';
      }
      setTimeout(() => { exitBtn._escCount = 0; }, 2000);
    }
  }
});

// ----------------------------------------------------------------
// Progress bar helpers
// ----------------------------------------------------------------
export function setProgress(elementId, percent) {
  const fill = document.getElementById(elementId);
  if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

// ----------------------------------------------------------------
// Copy to clipboard helper
// ----------------------------------------------------------------
export function copyToClipboard(text, feedbackEl) {
  navigator.clipboard.writeText(text).then(() => {
    if (feedbackEl) {
      const orig = feedbackEl.textContent;
      feedbackEl.textContent = 'Copied!';
      setTimeout(() => { feedbackEl.textContent = orig; }, 2000);
    }
    showToast('Copied to clipboard', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard', 'success');
  });
}

// ----------------------------------------------------------------
// Local storage: track page visit for "progress" indicators
// ----------------------------------------------------------------
export function markPageVisited(page) {
  const key = 'shn_visited';
  const visited = JSON.parse(localStorage.getItem(key) || '[]');
  if (!visited.includes(page)) {
    visited.push(page);
    localStorage.setItem(key, JSON.stringify(visited));
  }
}

export function getVisitedPages() {
  return JSON.parse(localStorage.getItem('shn_visited') || '[]');
}

// ----------------------------------------------------------------
// Print helper
// ----------------------------------------------------------------
export function printSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const content = section.innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Stable Housing Navigator</title>
    <link rel="stylesheet" href="css/main.css">
    <style>body{padding:2rem;max-width:800px;margin:0 auto;}</style>
    </head><body>${content}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
}

// Make helpers globally accessible for inline HTML event handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.copyToClipboard = copyToClipboard;
window.printSection = printSection;

/* =====================================================
   SCOTTY AI — Global JS v2
   ===================================================== */

/* ── STICKY HEADER ── */
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ── THEME TOGGLE ── */
(function initTheme() {
  const html   = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  // Default: dark. Respect localStorage if set.
  const saved  = localStorage.getItem('scotty-theme') || 'dark';
  html.setAttribute('data-theme', saved);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('scotty-theme', next);
      // Fix mobile menu background color on toggle
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu && mobileMenu.style.display !== 'none') {
        mobileMenu.style.background = next === 'dark' ? '#0D1F38' : '#fff';
      }
    });
  }
})();

/* ── ANIMATED COUNTERS ── */
function animateCounter(el) {
  const raw      = el.dataset.count;
  const target   = parseFloat(raw);
  const suffix   = el.dataset.suffix || '';
  const prefix   = el.dataset.prefix || '';
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  const duration = 2200;
  const startTS  = performance.now();

  function tick(now) {
    const t = Math.min((now - startTS) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val  = target * ease;
    el.textContent = prefix + val.toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterEls = document.querySelectorAll('[data-count]');
if (counterEls.length) {
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counterEls.forEach(el => counterObs.observe(el));
}

/* ── 80/20 SCROLL REVEAL ── */
const hookSection   = document.querySelector('.hook-split');
const blurredWrap   = document.querySelector('.blurred-wrap');
const blurredTable  = blurredWrap ? blurredWrap.querySelector('.split-table') : null;
const blurOverlay   = blurredWrap ? blurredWrap.querySelector('.split-blur-overlay') : null;

function updateSplitReveal() {
  if (!hookSection || !blurredTable) return;
  const rect   = hookSection.getBoundingClientRect();
  const wh     = window.innerHeight;
  const progress = Math.max(0, Math.min(1, (wh - rect.top) / (wh * 0.6)));

  const blurAmt = Math.max(0, 3 * (1 - progress * 2.2));
  const opacity = Math.min(1, 0.35 + progress * 1.3);
  blurredTable.style.filter  = `blur(${blurAmt.toFixed(2)}px)`;
  blurredTable.style.opacity = opacity.toFixed(3);

  if (blurOverlay) {
    blurOverlay.style.opacity = Math.max(0, 1 - progress * 3).toFixed(2);
  }

  if (progress >= 0.45 && blurredWrap) {
    blurredWrap.classList.add('revealed');
    window.removeEventListener('scroll', updateSplitReveal);
  }
}
if (hookSection) {
  window.addEventListener('scroll', updateSplitReveal, { passive: true });
  updateSplitReveal(); // init
}

/* ── AI SCANNING ANIMATION ── */
const scanBtn        = document.getElementById('scan-btn');
const agencyInput    = document.getElementById('jurisdiction-search');
const scanOverlay    = document.getElementById('scan-overlay');
const mockResults    = document.getElementById('mock-results');
const scanAgencyName = document.getElementById('scan-jurisdiction-name');
const resultsAgency  = document.getElementById('results-jurisdiction');
const progressFill   = document.getElementById('scan-progress-fill');
const statRecords    = document.getElementById('stat-records');
const statLines      = document.getElementById('stat-lines');
const statVariance   = document.getElementById('stat-variance');
const steps          = [0,1,2,3].map(i => document.getElementById('scan-step-'+i));
const suggestionChips = document.querySelectorAll('.suggestion-chip');
let isScanning = false;

function countUpEl(el, target, duration) {
  if (!el) return;
  let current = 0;
  const inc = target / (duration / 40);
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) { el.textContent = Math.round(target).toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.round(current).toLocaleString();
  }, 40);
}

function resetScan() {
  steps.forEach(s => s && s.classList.remove('active','done'));
  if (progressFill) progressFill.style.width = '0%';
  [statRecords,statLines,statVariance].forEach(el => { if(el) el.textContent = '0'; });
  if (mockResults) mockResults.classList.remove('revealed');
  if (scanOverlay) scanOverlay.classList.remove('active');
}

function runScan(agencyName) {
  if (isScanning || !scanBtn) return;
  const agency = agencyName || (agencyInput && agencyInput.value.trim()) || 'Maryland';
  if (agencyInput) agencyInput.value = agency;
  isScanning = true;
  resetScan();
  if (scanAgencyName) scanAgencyName.textContent = agency;
  if (resultsAgency)  resultsAgency.textContent  = agency;
  if (agencyInput) agencyInput.disabled = true;
  scanBtn.disabled = true;
  scanBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11" style="animation:spinIcon .7s linear infinite"><circle cx="5.5" cy="5.5" r="4.5" stroke="white" stroke-width="1.5" stroke-dasharray="10 8" fill="none"/></svg> Scanning…';
  if (scanOverlay) scanOverlay.classList.add('active');

  const stepDelays = [0,700,1350,2000];
  const stepDone   = [650,1300,1950,2600];
  steps.forEach((s, i) => {
    if (!s) return;
    setTimeout(() => s.classList.add('active'), stepDelays[i]);
    setTimeout(() => { s.classList.remove('active'); s.classList.add('done'); }, stepDone[i]);
  });

  let pct = 0;
  const progTimer = setInterval(() => {
    pct += 1.4;
    if (pct >= 100) { if (progressFill) progressFill.style.width = '100%'; clearInterval(progTimer); }
    else if (progressFill) progressFill.style.width = pct + '%';
  }, 42);

  setTimeout(() => countUpEl(statRecords, 14847, 2200), 300);
  setTimeout(() => countUpEl(statLines,    2301, 2000), 600);
  setTimeout(() => countUpEl(statVariance,   47, 1800), 900);

  setTimeout(() => {
    if (scanOverlay) scanOverlay.classList.remove('active');
    requestAnimationFrame(() => { if (mockResults) mockResults.classList.add('revealed'); });
    scanBtn.disabled = false;
    if (agencyInput) agencyInput.disabled = false;
    scanBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="white" stroke-width="1.4"/><path d="M7.5 7.5l2.2 2.2" stroke="white" stroke-width="1.4" stroke-linecap="round"/></svg> Analyze';
    isScanning = false;
  }, 3100);
}

// spin keyframe
const spinStyle = document.createElement('style');
spinStyle.textContent = '@keyframes spinIcon{to{transform:rotate(360deg)}}';
document.head.appendChild(spinStyle);

if (scanBtn) {
  scanBtn.addEventListener('click', () => runScan());
  if (agencyInput) agencyInput.addEventListener('keydown', e => { if (e.key === 'Enter') runScan(); });
}
suggestionChips.forEach(chip => chip.addEventListener('click', () => runScan(chip.dataset.query)));
setTimeout(() => runScan('Maryland'), 1800);

/* ── SOLUTION TABS ── */
document.querySelectorAll('.sol-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sol-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sol-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById('tab-' + tab.dataset.tab);
    if (target) target.classList.add('active');
  });
});

/* ── FAQ ACCORDION ── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    item.closest('.faq-category').querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ── FAQ SEARCH ── */
const faqSearch = document.getElementById('faq-search-input');
if (faqSearch) {
  faqSearch.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.faq-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
    document.querySelectorAll('.faq-category').forEach(cat => {
      const visible = [...cat.querySelectorAll('.faq-item')].some(i => i.style.display !== 'none');
      cat.style.display = visible ? '' : 'none';
    });
  });
}

/* ── MOBILE MENU ── */
const mobileToggle = document.querySelector('.mobile-toggle');
const mainNav      = document.querySelector('.main-nav');
const headerCtas   = document.querySelector('.header-ctas');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    // Check if menu is already open based on either mainNav or headerCtas
    const isOpen = (mainNav && mainNav.classList.contains('mobile-open')) || 
                   (headerCtas && headerCtas.classList.contains('mobile-open'));
                   
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const bgColor = isDark ? '#0D1F38' : '#fff';
    const bdColor = isDark ? 'rgba(255,255,255,.07)' : '#E2E8F0';

    if (isOpen) {
      mobileToggle.classList.remove('mobile-open');
      if (mainNav) {
        mainNav.classList.remove('mobile-open');
        Object.assign(mainNav.style, {display:'',flexDirection:'',position:'',top:'',left:'',right:'',background:'',padding:'',borderBottom:'',boxShadow:'',zIndex:''});
      }
      if (headerCtas) {
        headerCtas.classList.remove('mobile-open');
        Object.assign(headerCtas.style, {display:'',flexDirection:'',position:'',top:'',left:'',right:'',background:'',padding:'',borderBottom:'',zIndex:''});
      }
    } else {
      mobileToggle.classList.add('mobile-open');
      let currentTop = 68;
      
      if (mainNav) {
        mainNav.classList.add('mobile-open');
        Object.assign(mainNav.style, {display:'flex',flexDirection:'column',position:'absolute',top:currentTop+'px',left:'0',right:'0',background:bgColor,padding:'16px 24px',borderBottom:`1px solid ${bdColor}`,boxShadow:'0 8px 24px rgba(0,0,0,.2)',zIndex:'999'});
        currentTop += mainNav.scrollHeight || 150; // Fallback if 0
      }
      
      if (headerCtas) {
        headerCtas.classList.add('mobile-open');
        Object.assign(headerCtas.style, {display:'flex',flexDirection:'column',position:'absolute',top:currentTop+'px',left:'0',right:'0',background:bgColor,padding:'16px 24px 24px',borderBottom:`1px solid ${bdColor}`,zIndex:'998',boxShadow:!mainNav ? '0 8px 24px rgba(0,0,0,.2)' : ''});
      }
    }
  });
}

/* ── ACTIVE NAV LINK ── */
(function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop();
    if (href === path) link.classList.add('active');
  });
})();

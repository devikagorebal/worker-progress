console.log('script.js loaded');
document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js DOMContentLoaded');

  const forms = Array.from(document.querySelectorAll('form'));
  const STORAGE_KEY = 'wcb_worker_progress_draft_v1';

  function toast(msg, ms = 2400) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), ms);
  }

  function allFields() {
    return Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"]'));
  }

  const exclusiveGroups = document.querySelectorAll('[data-group]');
  const groupNames = new Set(Array.from(exclusiveGroups).map(el => el.dataset.group));
  groupNames.forEach(name => {
    const boxes = document.querySelectorAll(`[data-group="${name}"]`);
    boxes.forEach(box => {
      box.addEventListener('change', () => {
        if (box.checked) {
          boxes.forEach(other => { if (other !== box) other.checked = false; });
        }
      });
    });
  });

 
  function bindConditional(triggerSelector, matchValue, targetSelector) {
    const triggers = document.querySelectorAll(triggerSelector);
    const target = document.querySelector(targetSelector);
    if (!target || triggers.length === 0) return;
    function sync() {
      const active = document.querySelector(`${triggerSelector}:checked`);
      const on = active && active.value === matchValue;
      target.disabled = !on;
      if (on) target.focus({ preventScroll: true });
      else target.value = target.value; // keep value, just disabled
    }
    triggers.forEach(t => t.addEventListener('change', sync));
    sync();
  }

  bindConditional('[name="return_status"]', 'returned', '[name="returned_date"]');
  bindConditional('[name="treatment_status"]', 'continuing', '[name="treatment_provider_type"]');
  bindConditional('[name="medication_status"]', 'taking', '[name="medication_name"]');
  bindConditional('[name="home_exercise_status"]', 'doing', '[name="exercises_list"]');

  const painScale = document.querySelector('.pain-scale');
  let painValue = null;
  if (painScale) {
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = i;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.dataset.value = i;
      btn.addEventListener('click', () => {
        painValue = i;
        painScale.querySelectorAll('button').forEach(b => {
          b.setAttribute('aria-checked', String(Number(b.dataset.value) === i));
        });
        persistDraft();
      });
      painScale.appendChild(btn);
    }
    const legend = document.createElement('div');
    legend.className = 'pain-scale-legend';
    legend.innerHTML = '<span>1 · No pain</span><span>10 · Severe pain</span>';
    painScale.after(legend);
  }

  const claimNo = document.getElementById('claim-no');
  const claimEchoes = document.querySelectorAll('.claim-echo');
  if (claimNo) {
    claimNo.addEventListener('input', () => {
      const val = claimNo.textContent.trim() || '00000000';
      claimEchoes.forEach(e => e.textContent = val);
    });
  }

  const fillBtn = document.getElementById('fillSample');
  if (fillBtn) {
    fillBtn.addEventListener('click', () => {
      const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val; };
      const check = (sel) => { const el = document.querySelector(sel); if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } };

      check('[name="return_status"][value="returned"]');
      set('[name="returned_date"]', '2024-03-15');
      check('[name="working_duties"][value="modified_reduced"]');
      set('[name="return_progress"]', 'Terrible. Testing Testing');
      set('[name="expect_return"]', '2024-03-30');
      set('[name="concerns"]', 'Concerned about long shifts on my feet.');
      set('[name="contact_person"]', 'Jane Doe');
      set('[name="contact_date"]', '2024-03-10');
      check('[name="recovered"][value="not"]');
      set('[name="recovery_comments"]', 'Still attending physiotherapy twice weekly.');

      check('[name="treatment_status"][value="continuing"]');
      set('[name="treatment_provider_type"]', 'Physiotherapist');
      set('[name="last_treatment_date"]', '2024-03-01');
      set('[name="last_treatment_provider"]', 'Dr. Smith');
      set('[name="next_treatment_date"]', '2024-04-01');
      set('[name="next_treatment_provider"]', 'Dr. Smith');
      set('[name="therapy_freq"]', 'Weekly');
      check('[name="medication_status"][value="taking"]');
      set('[name="medication_name"]', 'PainRelief 50mg');
      check('[name="home_exercise_status"][value="doing"]');
      set('[name="exercises_list"]', 'Stretching, light strengthening exercises daily.');
      set('[name="other_info"]', 'No additional info. Testing Testing');

      if (painScale) painScale.querySelectorAll('button')[2].click();

      toast('Sample data filled in');
      persistDraft();
    });
  }

  const clearBtn = document.getElementById('clearForm');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all answers on this form? This cannot be undone.')) return;
      forms.forEach(f => f.reset());
      document.querySelectorAll('[name="medication_name"], [name="exercises_list"], [name="returned_date"], [name="treatment_provider_type"]')
        .forEach(el => el.disabled = true);
      if (painScale) painScale.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', 'false'));
      painValue = null;
      localStorage.removeItem(STORAGE_KEY);
      toast('Form cleared');
    });
  }

  function collectData() {
    const data = {};
    allFields().forEach(el => {
      const key = el.name || el.id;
      if (!key) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) {
          data[key] = data[key] || [];
          data[key].push(el.value);
        }
      } else if (el.hasAttribute && el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') === 'true') {
        // store contenteditable text under its id
        data[key] = el.textContent.trim();
      } else {
        data[key] = el.value;
      }
    });

    if (!data.__claimNo) data.__claimNo = claimNo ? (data['claim-no'] || claimNo.textContent.trim()) : '';
    if (!data.__workerName) data.__workerName = document.getElementById('workerNameDisplay') ? (data['workerNameDisplay'] || document.getElementById('workerNameDisplay').textContent.trim()) : '';
    data.__pain = painValue;
    return data;
  }

  function persistDraft() {
    try {
      const payload = collectData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      console.log('persistDraft: saved', STORAGE_KEY, payload);
    } catch (e) {
      console.error('persistDraft: failed to save to localStorage', e);
    }
  }

  function restoreDraft() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { console.error('restoreDraft: failed to read localStorage', e); return; }
    console.log('restoreDraft: raw', STORAGE_KEY, raw);
    if (!raw) return;
    let data;
    try { data = JSON.parse(raw); } catch (e) { console.error('restoreDraft: failed to parse JSON', e); return; }

    allFields().forEach(el => {
      const key = el.name || el.id;
      if (!key || !(key in data)) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (Array.isArray(data[key]) && data[key].includes(el.value)) {
          el.checked = true;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else if (el.hasAttribute && el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') === 'true') {
        el.textContent = data[key];
      } else {
        el.value = data[key];
      }
    });
    if ((data.__claimNo || data['claim-no']) && claimNo) {
      const val = data['claim-no'] || data.__claimNo;
      claimNo.textContent = val;
      claimEchoes.forEach(e => e.textContent = val);
    }
    if ((data.__workerName || data['workerNameDisplay'])) {
      const wn = document.getElementById('workerNameDisplay');
      if (wn) wn.textContent = data['workerNameDisplay'] || data.__workerName;
    }
    if (data.__pain && painScale) {
      const btn = painScale.querySelector(`button[data-value="${data.__pain}"]`);
      if (btn) btn.click();
    }
    toast('Draft restored from your last visit');
  }

  document.addEventListener('input', persistDraft);
  document.addEventListener('change', persistDraft);
  restoreDraft();

  // Submission preview + confirm
  const overlay = document.getElementById('previewOverlay');
  const previewBody = document.getElementById('previewBody');

  const fieldLabels = {
    return_status: 'Return to work status',
    returned_date: 'Returned to work on',
    working_duties: 'Working duties',
    working_other: 'Other duties',
    return_progress: 'Return to work is going',
    expect_return: 'Expected return date',
    concerns: 'Concerns about returning',
    contact_person: 'Most recent employer contact',
    contact_date: 'Contact date',
    recovered: 'Recovery status',
    recovery_comments: 'Recovery comments',
    treatment_status: 'Medical treatment status',
    treatment_provider_type: 'Medical provider type',
    last_treatment_date: 'Last treatment date',
    last_treatment_provider: 'Last treatment provider',
    next_treatment_date: 'Next treatment date',
    next_treatment_provider: 'Next treatment provider',
    therapy_freq: 'Chiropractor/physio frequency',
    medication_status: 'Medication status',
    medication_name: 'Medication name',
    home_exercise_status: 'Home exercise status',
    exercises_list: 'Exercises',
    other_info: 'Additional information'
  };

  function buildPreview() {
    const data = collectData();
    let html = `<dl>`;
    html += `<dt>Claim No.</dt><dd>${escapeHtml(data.__claimNo || '—')}</dd>`;
    html += `<dt>Worker</dt><dd>${escapeHtml(data.__workerName || '—')}</dd>`;
    Object.keys(fieldLabels).forEach(key => {
      const val = data[key];
      if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return;
      const display = Array.isArray(val) ? val.join(', ') : val;
      html += `<dt>${fieldLabels[key]}</dt><dd>${escapeHtml(String(display))}</dd>`;
    });
    html += `<dt>Pain / discomfort rating</dt><dd>${data.__pain ? data.__pain + ' / 10' : '—'}</dd>`;
    html += `</dl>`;
    previewBody.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const cert = document.getElementById('certAgree');
      const privacy = document.getElementById('privacyAgree');
      if (!cert.checked || !privacy.checked) {
        toast('Please confirm both certification statements before submitting');
        cert.closest('.chk').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      buildPreview();
      overlay.classList.add('show');
    });
  }

  function closeModal() { overlay.classList.remove('show'); }
  const c1 = document.getElementById('closePreview');
  const c2 = document.getElementById('closePreview2');
  if (c1) c1.addEventListener('click', closeModal);
  if (c2) c2.addEventListener('click', closeModal);
  overlay && overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  const confirmBtn = document.getElementById('confirmSubmit');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const now = new Date();
      const stamp = now.toLocaleString('en-CA', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      document.querySelectorAll('.submitted-date').forEach(el => el.textContent = stamp);
      localStorage.removeItem(STORAGE_KEY);
      closeModal();
      toast('Worker Progress Report submitted');
    });
  }

  const printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

});

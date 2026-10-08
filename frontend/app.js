/**
 * AegisMail 3D - Application Controller
 * Handles 3D card tilt, form submission, API integration, and interactive visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Scene
  let scene3D = null;
  try {
    scene3D = new MailScene3D('threeContainer');
  } catch (err) {
    console.error('Error initializing 3D scene:', err);
  }

  // 2. DOM Elements
  const emailForm = document.getElementById('emailForm');
  const senderInput = document.getElementById('senderInput');
  const subjectInput = document.getElementById('subjectInput');
  const bodyInput = document.getElementById('bodyInput');
  const attachmentInput = document.getElementById('attachmentInput');
  const charCount = document.getElementById('charCount');
  const resetBtn = document.getElementById('resetBtn');

  // Result display
  const verdictText = document.getElementById('verdictText');
  const verdictBadge = document.getElementById('verdictBadge');
  const gaugeBar = document.getElementById('gaugeBar');
  const gaugeValue = document.getElementById('gaugeValue');
  const spamProbText = document.getElementById('spamProbText');
  const spamProbBar = document.getElementById('spamProbBar');
  const hamProbText = document.getElementById('hamProbText');
  const hamProbBar = document.getElementById('hamProbBar');
  const confidenceText = document.getElementById('confidenceText');
  const holoStatusText = document.getElementById('holoStatusText');
  const connectionStatus = document.getElementById('connectionStatus');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeSpinner = document.getElementById('analyzeSpinner');

  // Feature chips
  const fLinks = document.getElementById('fLinks');
  const fSpam = document.getElementById('fSpam');
  const fUrgent = document.getElementById('fUrgent');
  const fPhish = document.getElementById('fPhish');
  const fEvasions = document.getElementById('fEvasions');
  const fExcl = document.getElementById('fExcl');
  const fUpper = document.getElementById('fUpper');
  const fHtml = document.getElementById('fHtml');
  const fLen = document.getElementById('fLen');

  // 3. Card 3D Tilt Effect
  setupTiltCards();

  // 4. Check Backend Health
  checkBackendHealth();

  // 6. Character Count & Live Watchers
  function updateCharCount() {
    const total = (subjectInput.value.length || 0) + (bodyInput.value.length || 0);
    charCount.textContent = `${total} characters`;
  }
  bodyInput.addEventListener('input', updateCharCount);
  subjectInput.addEventListener('input', updateCharCount);
  updateCharCount();

  // 7. Reset
  resetBtn.addEventListener('click', () => {
    emailForm.reset();
    updateCharCount();
    resetVerdict();
    if (scene3D) scene3D.updateState('Idle');
  });

  function resetVerdict() {
    verdictText.textContent = "Pending Scan";
    verdictText.style.color = "#fff";
    verdictBadge.className = "verdict-badge neutral";
    verdictBadge.textContent = "Awaiting Input";
    updateGauge(0);
    spamProbText.textContent = "0%";
    spamProbBar.style.width = "0%";
    hamProbText.textContent = "0%";
    hamProbBar.style.width = "0%";
    confidenceText.textContent = "0.0%";
    holoStatusText.textContent = "Aegis Core Active";
  }

  // 9. Form Submission
  emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerAnalyze();
  });

  async function triggerAnalyze() {
    // Input validation: require at least subject or body
    const subject = subjectInput.value.trim();
    const body = bodyInput.value.trim();
    if (!subject && !body) {
      showError('Please enter at least a subject line or email body to classify.');
      return;
    }

    setLoading(true);
    if (scene3D) scene3D.updateState('Scanning');
    holoStatusText.textContent = "Evaluating Threat Signals...";

    const payload = {
      subject: subjectInput.value,
      body: bodyInput.value,
      sender: senderInput.value,
      num_attachments: parseInt(attachmentInput.value) || 0
    };

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const detail = errorData && errorData.detail ? errorData.detail : 'Server returned an error.';
        throw new Error(detail);
      }
      const data = await response.json();
      renderResult(data);
    } catch (err) {
      console.error('Prediction API error:', err);
      showError('Unable to analyze the email right now. Please ensure the backend server is running and try again.');
      if (scene3D) scene3D.updateState('Idle');
      holoStatusText.textContent = "Backend Unavailable";
    } finally {
      setLoading(false);
    }
  }

  function showError(message) {
    verdictText.textContent = message;
    verdictText.style.color = 'var(--warning, #f59e0b)';
    verdictBadge.className = 'verdict-badge neutral';
    verdictBadge.textContent = 'ERROR';
    updateGauge(0);
    spamProbText.textContent = '--';
    spamProbBar.style.width = '0%';
    hamProbText.textContent = '--';
    hamProbBar.style.width = '0%';
    confidenceText.textContent = '--';
  }

  function setLoading(loading) {
    if (loading) {
      analyzeBtn.disabled = true;
      analyzeSpinner.style.display = 'inline-block';
    } else {
      analyzeBtn.disabled = false;
      analyzeSpinner.style.display = 'none';
    }
  }

  function renderResult(data) {
    const isSpam = data.prediction === 1;
    const spamProb = data.spam_probability;
    const hamProb = data.ham_probability;
    const confidence = data.confidence;
    const feats = data.features;

    // 1. Update Verdict Header
    if (isSpam) {
      verdictText.textContent = "🚨 Spam / Malicious";
      verdictText.style.color = "var(--danger)";
      verdictBadge.className = "verdict-badge spam";
      verdictBadge.textContent = "THREAT DETECTED";
      holoStatusText.textContent = "Security Alert: Threat Blocked";
      if (scene3D) scene3D.updateState('Spam');
    } else {
      verdictText.textContent = "🛡️ Legitimate (Ham)";
      verdictText.style.color = "var(--safe)";
      verdictBadge.className = "verdict-badge safe";
      verdictBadge.textContent = "VERIFIED SAFE";
      holoStatusText.textContent = "Inbox Safe: Integrity Clean";
      if (scene3D) scene3D.updateState('Safe');
    }

    // 2. Update Gauge & Probabilities
    updateGauge(spamProb);
    spamProbText.textContent = `${spamProb}%`;
    spamProbBar.style.width = `${spamProb}%`;
    hamProbText.textContent = `${hamProb}%`;
    hamProbBar.style.width = `${hamProb}%`;
    confidenceText.textContent = `${confidence}%`;

    // 3. Update Feature Chips
    if (feats) {
      fLinks.textContent = feats.num_links;
      fSpam.textContent = feats.has_spam_words ? "Yes" : "No";
      fUrgent.textContent = feats.has_urgent_words ? "Yes" : "No";
      fPhish.textContent = feats.has_phishing_words ? "Yes" : "No";
      if (fEvasions) fEvasions.textContent = feats.evasion_tokens || 0;
      fExcl.textContent = feats.num_exclamations;
      fUpper.textContent = feats.num_uppercase_words;
      fHtml.textContent = feats.contains_html ? "Yes" : "No";
      fLen.textContent = feats.email_length;

      // Color code highlight chips
      highlightChip(fSpam, feats.has_spam_words);
      highlightChip(fUrgent, feats.has_urgent_words);
      highlightChip(fPhish, feats.has_phishing_words);
      if (fEvasions) highlightChip(fEvasions, (feats.evasion_tokens || 0) > 0);
    }
  }

  function highlightChip(el, isTriggered) {
    const chip = el.parentElement;
    if (isTriggered) {
      chip.style.borderColor = 'rgba(244, 63, 94, 0.4)';
      chip.style.background = 'rgba(244, 63, 94, 0.1)';
      el.style.color = 'var(--danger)';
    } else {
      chip.style.borderColor = 'var(--border-subtle)';
      chip.style.background = 'rgba(255, 255, 255, 0.03)';
      el.style.color = '#fff';
    }
  }

  function updateGauge(percentage) {
    gaugeValue.textContent = `${Math.round(percentage)}%`;
    // Circumference = 2 * PI * 50 = 314.159
    const circumference = 314.159;
    const offset = circumference - (percentage / 100) * circumference;
    gaugeBar.style.strokeDashoffset = offset;

    if (percentage > 50) {
      gaugeBar.style.stroke = "var(--danger)";
      gaugeBar.style.filter = "drop-shadow(0 0 8px rgba(244, 63, 94, 0.6))";
    } else {
      gaugeBar.style.stroke = "var(--safe)";
      gaugeBar.style.filter = "drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))";
    }
  }

  // 10. Backend Health Check
  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        connectionStatus.textContent = "ML Engine Live (TF-IDF)";
      } else {
        connectionStatus.textContent = "Backend Error";
      }
    } catch {
      connectionStatus.textContent = "Backend Offline";
    }
  }

  // 12. 3D Tilt Card implementation
  function setupTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4.5;
        const rotateY = ((x - centerX) / centerX) * 4.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.008, 1.008, 1.008)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  }
});

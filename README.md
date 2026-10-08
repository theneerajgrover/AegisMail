# AegisMail 3D — Adversarially Robust AI Email Spam & Scam Classifier

<p align="center">
  <img src="assets/screenshots/01_dashboard_idle.png" alt="AegisMail 3D Dashboard" width="100%" />
</p>

<p align="center">
  <a href="https://theneerajgrover.github.io/AegisMail/"><img src="https://img.shields.io/badge/Live_Demo-GitHub_Pages-06b6d4?style=for-the-badge&logo=github" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Model-TF--IDF_%2B_LogReg-6366f1?style=for-the-badge" alt="Model" />
  <img src="https://img.shields.io/badge/Frontend-Three.js_3D-10b981?style=for-the-badge" alt="Three.js" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-f43f5e?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-amber?style=for-the-badge" alt="MIT License" /></a>
</p>

---

## 🌟 Overview

**AegisMail 3D** is an industry-grade, cybersecurity-focused email scam and spam classification application. Built with a sober glassmorphic UI and interactive **Three.js 3D holographic security visualization**, AegisMail is specifically engineered to defeat real-world evasion attacks that bypass conventional keyword filters and synthetic ML models.

### 🚀 Try It Live: [https://theneerajgrover.github.io/AegisMail/](https://theneerajgrover.github.io/AegisMail/)
> **Dual Engine Architecture**: Runs 100% client-side in any web browser via an in-browser Web ML engine on GitHub Pages, or connects seamlessly to the Python FastAPI backend when deployed on a server.

---

## 📸 Visual Showcase & Detection Gallery

The table below documents AegisMail's real-time detection across adversarial threat vectors and legitimate workplace correspondence:

| Attack Vector / Scenario | Live Interface Capture | Detection Details & Verdict |
|---|---|---|
| **1. Clean Dashboard & 3D Core** | <img src="assets/screenshots/01_dashboard_idle.png" width="480" alt="Dashboard Idle" /> | **Initial Idle State**<br>• Real-time 3D Three.js holographic mail node in orbiting standby<br>• Interactive 3D tilt cards & one-click quick demo preset bar<br>• Dual-mode health indicator (`ML Engine Live`) |
| **2. High-Yield Financial Scam** | <img src="assets/screenshots/02_scam_lottery_prize.png" width="480" alt="Lottery Scam" /> | **🚨 Verdict: Spam / Malicious (99.74% Threat)**<br>• Attack: $1,000,000 international lottery lure requesting banking credentials<br>• Action: 3D holographic node shifts to crimson threat pulse<br>• Signals: High-priority spam words & urgency flags activated |
| **3. Obfuscated Leetspeak Evasion** | <img src="assets/screenshots/03_scam_leetspeak_evasion.png" width="480" alt="Leetspeak Evasion" /> | **🚨 Verdict: Spam / Malicious (98.87% Threat)**<br>• Attack: `C0ngr@tul@ti0ns! U r selected for a fr33 $1,000 gift c@rd` (character substitutions: `@`, `0`, `3`)<br>• Defense: Automatic homoglyph canonicalization & char-wb n-grams<br>• Security Chip: **Evasions: 9** detected and flagged |
| **4. Bayesian Poisoning / Ham Stuffing** | <img src="assets/screenshots/04_scam_ham_stuffing_poisoning.png" width="480" alt="Ham Stuffing" /> | **🚨 Verdict: Spam / Malicious (99.68% Threat)**<br>• Attack: Prescription spam (`Get cheap prescriptions online without a doctor note`) padded with academic memo boilerplate<br>• Defense: Multi-scale sentence/segment scanning prevents benign padding from diluting threat score |
| **5. Fake Shared Drive Phishing Lure** | <img src="assets/screenshots/05_scam_fake_drive_lure.png" width="480" alt="Drive Lure" /> | **🚨 Verdict: Spam / Malicious (95.27% Threat)**<br>• Attack: Social engineering lure claiming updated property details are waiting on a drive link<br>• Defense: Document lure and cloud drive intent recognition patterns |
| **6. Legitimate Corporate Sync** | <img src="assets/screenshots/06_legitimate_project_sync.png" width="480" alt="Legitimate Ham" /> | **🛡️ Verdict: Legitimate (Ham) (99.8% Safe)**<br>• Context: Corporate project review, sprint action items, and calendar sync<br>• Calibration: Balanced weighting ensures polite business terms (*"please review"*, *"attached"*, *"sync"*) maintain 0% false positives |

---

## 🛡️ Multi-Scale Defense Architecture

Conventional email filters evaluate either isolated words or raw document averages, leaving them vulnerable to evasive attackers. AegisMail combines four layers of defense:

```
[ Incoming Email (Subject + Body) ]
               │
               ▼
┌──────────────────────────────────────────────┐
│ Layer 1: Text Canonicalization & De-Leet      │
│  • Normalizes homoglyphs (@ -> a, 0 -> o)    │
│  • Expands chat shorthand (u r -> you are)   │
│  • Tracks evasion attempts (evasion_tokens)  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Layer 2: Hybrid TF-IDF Feature Space         │
│  • Word N-Grams (1-2 words, 40,000 features) │
│  • Subword Char-WB (3-5 chars, 25,000 feats) │
│  • Independent L2 unit normalization         │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Layer 3: Multi-Scale Segment Scanning        │
│  • Document-level global threat evaluation   │
│  • Sentence-level anti-poisoning scan        │
│  • Max-pooling override for severe payloads  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ Layer 4: Three.js 3D Visual Feedback         │
│  • Green Shield Node: Verified Safe (Ham)    │
│  • Red Orbiting Wireframe: Threat Detected   │
│  • Live Probability Gauge & Signal Matrix    │
└──────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
AegisMail/
├── assets/
│   └── screenshots/              # High-resolution labeled visual evidence
│       ├── 01_dashboard_idle.png
│       ├── 02_scam_lottery_prize.png
│       ├── 03_scam_leetspeak_evasion.png
│       ├── 04_scam_ham_stuffing_poisoning.png
│       ├── 05_scam_fake_drive_lure.png
│       └── 06_legitimate_project_sync.png
├── docs/                         # GitHub Pages static production build
│   ├── index.html                # Responsive glassmorphic layout
│   ├── style.css                 # Dark-mode styling, 3D card tilt & animations
│   ├── three-scene.js            # Three.js 3D holographic security core
│   ├── ml-engine.js              # Standalone in-browser Web ML engine
│   ├── model_weights.json        # Pre-computed model weights & IDFs
│   └── app.js                    # Controller with dual-mode inference
├── frontend/                     # Development frontend source files
├── model/                        # Python ML training pipeline & artifacts
│   ├── text_classifier.joblib    # Trained Logistic Regression model
│   ├── tfidf_vectorizer.joblib   # Trained FeatureUnion (word + char_wb)
│   ├── model_info.json           # Model metadata & hyperparameters
│   ├── xgb_model.joblib          # Legacy reference model
│   └── feature_extractor.py      # Python inference & canonicalization
├── .github/
│   └── workflows/
│       └── deploy-pages.yml      # Automated GitHub Actions Pages deployment
├── server.py                     # FastAPI backend application
├── requirements.txt              # Backend Python dependencies
├── LICENSE                       # MIT License
└── README.md                     # Documentation
```

---

## ⚡ Quick Start & Local Execution

### Option A: Open Directly in Browser (No Server Needed)
Simply open `docs/index.html` or `frontend/index.html` in any modern web browser. The built-in Web ML engine runs client-side with zero dependencies!

### Option B: Run with Python FastAPI Backend

1. **Clone the repository**:
   ```bash
   git clone https://github.com/theneerajgrover/AegisMail.git
   cd AegisMail
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server**:
   ```bash
   python server.py
   ```

4. **Access the web app**:
   Navigate to [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📡 API Specification

### `POST /api/predict`
Evaluates email subject, body, and metadata for scam, phishing, and spam signals.

**Request Body:**
```json
{
  "subject": "Fr33 Gift C@rd Claim",
  "body": "C0ngr@tul@ti0ns! U r selected for a fr33 $1,000 gift c@rd. Click here tO cl@im nOw.",
  "sender": "reward@promotions.net",
  "num_attachments": 0
}
```

**Response Body:**
```json
{
  "success": true,
  "prediction": 1,
  "status": "Scam",
  "spam_probability": 98.87,
  "ham_probability": 1.13,
  "confidence": 98.87,
  "features": {
    "num_links": 0,
    "num_attachments": 0,
    "has_urgent_words": 0,
    "has_spam_words": 1,
    "has_phishing_words": 0,
    "contains_html": 0,
    "email_length": 83,
    "num_exclamations": 1,
    "num_uppercase_words": 0,
    "evasion_tokens": 9
  }
}
```

### `GET /api/health`
Health check and active model verification.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — Copyright © 2026 **Neeraj Grover**.

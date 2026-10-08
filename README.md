# AegisMail 3D - Adversarially Robust AI Email Spam & Scam Classifier

A modern 3D web application powered by a hybrid Word + Subword Char-WB TF-IDF classification model with multi-scale segment-level scanning and text canonicalization. Designed specifically to detect real-world email threats, obfuscated leetspeak evasions, Bayesian ham-stuffing attacks, and fake document lures.

## Project Structure
```
EMAIL_spam_classification/
├── model/
│   ├── text_classifier.joblib   # Trained robust classifier (LogisticRegression, C=1.0)
│   ├── tfidf_vectorizer.joblib  # Trained FeatureUnion (Word TF-IDF + Char_wb TF-IDF)
│   ├── model_info.json          # Model metadata, performance metrics & training parameters
│   ├── xgb_model.joblib         # Legacy numeric feature model (archived)
│   └── feature_extractor.py     # Multi-scale inference & de-obfuscation pipeline
├── frontend/
│   ├── index.html               # Modern dark-mode glassmorphic UI layout
│   ├── style.css                # Glassmorphic styles & 3D tilt effects
│   ├── three-scene.js           # Interactive 3D Three.js holographic security core
│   └── app.js                   # Frontend controller & API integration
├── server.py                    # FastAPI server serving frontend and /api/predict
└── README.md
```

## Security Defenses & Model Architecture

1. **Adversarial Leetspeak & Obfuscation Evasion Defense**:
   - **Text Canonicalization**: Automatically normalizes homoglyphs and leetspeak character substitutions (`@` -> `a`, `0` -> `o`, `3` -> `e`, `fr33` -> `free`, `c@rd` -> `card`, `cl@im` -> `claim`).
   - **Subword Character N-grams (`char_wb`, 3–5 ngrams)**: Captures morphological and subword structures to withstand intentional typos and obfuscations.
   - **Evasion Detection Signal**: Measures intentional substitution attempts and factors them into threat analysis.

2. **Bayesian Poisoning & Ham Word Stuffing Defense**:
   - **Multi-Scale Segment Scanning**: Evaluates the email both as a whole document and across individual sentences/paragraphs.
   - If an email contains a high-confidence scam or illegal pharma payload (e.g. *"Get cheap prescriptions online without a doctor note"*), appending benign academic/corporate text cannot dilute or suppress the threat detection.

3. **Fake Shared Document & Drive Lure Phishing Defense**:
   - Detects social engineering lures referencing shared drives, Dropbox, OneDrive, and unrequested property/invoice document review links.

4. **Balanced Legitimacy Calibration**:
   - Calibrated with natural business, academic, and conversational communications so polite phrases (*"please review"*, *"attached CV"*, *"meeting sync"*) maintain high ham confidence and prevent false positives.

## Evaluation & Test Results

| Attack / Scenario | Sample Input | Expected | System Verdict |
|---|---|---|---|
| **Leetspeak Evasion** | `"C0ngr@tul@ti0ns! U r selected for a fr33 $1,000 gift c@rd. Click here tO cl@im nOw."` | Scam | **🚨 Scam (98.82% threat)** |
| **Ham Stuffing / Pharma** | `"Get cheap prescriptions online without a doctor note. [Separate Section Below] Note: The information contained in this internal academic research memo is strictly confidential..."` | Scam | **🚨 Scam (99.69% threat)** |
| **Document Lure Phishing** | `"Hey, I found that document you asked for regarding the property details. Everything is updated on the drive link here for you to look over whenever you get a minute."` | Scam | **🚨 Scam (94.95% threat)** |
| **Lottery Winner Scam** | `"CONGRATULATIONS! You have been selected as the lucky winner of our $1,000,000 international lottery prize!..."` | Scam | **🚨 Scam (99.74% threat)** |
| **Legitimate Project Review** | `"Hi team, thanks for attending today's project review. Attached are the updated slides and action items for next week. Please review before our sync on Friday."` | Ham | **🛡️ Legitimate (99.75% safe)** |

## Running the Application
1. Start the server:
   ```bash
   python server.py
   ```
2. Open in your browser:
   ```
   http://localhost:8000
   ```

## API Endpoints
- `GET /api/health`: Health status, model verification, and active feature pipeline.
- `POST /api/predict`: Performs multi-scale threat analysis on submitted email content (`subject`, `body`, `sender`).

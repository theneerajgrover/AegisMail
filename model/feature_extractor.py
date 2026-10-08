import re
import os
from typing import Dict, Any, Tuple
# pyrefly: ignore [missing-import]
import joblib
import numpy as np

# Leetspeak / obfuscation normalization dictionary
LEET_REPLACEMENTS = {
    '@': 'a',
    '0': 'o',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '$': 's',
    '8': 'b',
    '+': 't',
}

def deobfuscate_token(w: str) -> Tuple[str, int]:
    """Deobfuscates a single word if it contains leetspeak characters mixed with letters.
    Preserves clean numbers, currency values, and percentages.
    """
    if re.match(r'^\$?\d+([,\.]\d+)*%?$', w):
        return w, 0
    has_alpha = any(c.isalpha() for c in w)
    subs = 0
    new_chars = []
    for c in w:
        if c in LEET_REPLACEMENTS and (has_alpha or c in '@$'):
            new_chars.append(LEET_REPLACEMENTS[c])
            subs += 1
        else:
            new_chars.append(c)
    return ''.join(new_chars), subs

def canonicalize_text(text: str) -> Tuple[str, int]:
    """Normalizes leetspeak, expands chat shorthand, and counts evasion tokens."""
    tokens = text.split()
    total_subs = 0
    clean_tokens = []
    for t in tokens:
        c, s = deobfuscate_token(t)
        total_subs += s
        clean_tokens.append(c)
    res = ' '.join(clean_tokens)
    
    shorthands = [
        (r'\bu\s+r\b', 'you are'),
        (r'\bu\b', 'you'),
        (r'\br\b', 'are'),
        (r'\bur\b', 'your'),
        (r'\bplz\b|\bpls\b', 'please'),
        (r'\bfr33\b|\bfreee+\b', 'free'),
        (r'\bw1n\b', 'win'),
        (r'\bcl@im\b|\bcla1m\b', 'claim'),
        (r'\bc@rd\b', 'card'),
        (r'\bt0\b', 'to'),
        (r'\bn0w\b', 'now'),
    ]
    for pat, rep in shorthands:
        if re.search(pat, res, flags=re.I):
            total_subs += 1
            res = re.sub(pat, rep, res, flags=re.I)
    return res, total_subs

# Keywords used for UI feature chips display
URGENT_KEYWORDS = [
    'urgent', 'immediately', 'act now', 'action required', 'expires',
    'suspended', 'critical', 'final notice', 'alert', 'time sensitive',
    'do not delay', 'warning', 'immediate attention', 'last chance'
]

SPAM_KEYWORDS = [
    'free', 'winner', 'prize', 'lottery', 'cash', 'win', 'congratulations',
    'claim', 'bonus', '100% free', 'earn money', 'risk-free', 'investment opportunity',
    'selected', 'guaranteed', 'unclaimed', 'million dollars', 'giveaway',
    'prescriptions online', 'without doctor note', 'pharmacy', 'viagra', 'cialis'
]

PHISHING_KEYWORDS = [
    'verify your account', 'password', 'credentials', 'bank account',
    'security alert', 'ssn', 'wire transfer', 'billing update', 'reset password',
    'unauthorized access', 'confirm identity', 'login below', 'drive link',
    'shared document', 'dropbox link', 'onedrive', 'look over the drive'
]


class EmailClassifierService:
    """Robust multi-scale email classifier defending against:
    1. Obfuscation & Leetspeak evasion (via canonicalization & subword char_wb features)
    2. Bayesian poisoning & Good Word Stuffing (via segment-level max pooling)
    3. Document lure & Fake shared drive phishing templates
    """

    def __init__(self, model_dir: str = "model"):
        model_path = os.path.join(model_dir, "text_classifier.joblib")
        vectorizer_path = os.path.join(model_dir, "tfidf_vectorizer.joblib")

        self.model = joblib.load(model_path)
        self.vectorizer = joblib.load(vectorizer_path)

    def extract_display_features(self, subject: str = "", body: str = "",
                                  sender: str = "", num_attachments: int = 0,
                                  evasion_tokens: int = 0) -> Dict[str, Any]:
        """Extract features for UI display chips."""
        full_text = f"{subject}\n{body}".strip()
        lower_text = full_text.lower()
        clean_text, _ = canonicalize_text(lower_text)

        url_pattern = re.compile(r'https?://\S+|www\.\S+|href=["\']?[^"\'>]+|\bdrive\s+link\b', re.IGNORECASE)
        num_links = len(url_pattern.findall(full_text))

        has_urgent = 1 if any(kw in lower_text or kw in clean_text for kw in URGENT_KEYWORDS) else 0
        has_spam = 1 if (any(kw in lower_text or kw in clean_text for kw in SPAM_KEYWORDS) or evasion_tokens > 0) else 0
        has_phishing = 1 if any(kw in lower_text or kw in clean_text for kw in PHISHING_KEYWORDS) else 0

        html_pattern = re.compile(r'<[a-z][\s\S]*>', re.IGNORECASE)
        contains_html = 1 if bool(html_pattern.search(full_text)) else 0

        num_exclamations = full_text.count('!')

        words = re.findall(r'\b[A-Za-z]+\b', full_text)
        num_uppercase = len([w for w in words if len(w) > 1 and w.isupper()])

        return {
            'num_links': num_links,
            'num_attachments': num_attachments,
            'has_urgent_words': has_urgent,
            'has_spam_words': has_spam,
            'has_phishing_words': has_phishing,
            'contains_html': contains_html,
            'email_length': len(full_text),
            'num_exclamations': num_exclamations,
            'num_uppercase_words': num_uppercase,
            'evasion_tokens': evasion_tokens
        }

    def predict(self, subject: str = "", body: str = "",
                sender: str = "", num_attachments: int = 0) -> Dict[str, Any]:
        """Classify email using canonicalized multi-scale TF-IDF pipeline."""
        raw_text = f"{subject} {body}".strip()
        if not raw_text:
            raw_text = " "

        # 1. Canonicalize text (resolve leetspeak, contractions) and count evasion attempts
        clean_text, evasion_count = canonicalize_text(raw_text)

        # 2. Document-level evaluation
        X_doc = self.vectorizer.transform([clean_text])
        proba_doc = self.model.predict_proba(X_doc)[0]
        doc_spam = float(proba_doc[1])

        # 3. Segment-level evaluation (Defense against Bayesian Poisoning / Ham Stuffing)
        # Split into sentences or paragraphs
        raw_segments = [
            s.strip() for s in re.split(r'[\n\r]+|(?<=[.!?])\s+|\[.*?\]', raw_text)
            if len(s.strip().split()) >= 3
        ]
        
        max_seg_scam = doc_spam
        if raw_segments:
            seg_scores = []
            for seg in raw_segments:
                c_seg, _ = canonicalize_text(seg)
                X_seg = self.vectorizer.transform([c_seg])
                p_seg = float(self.model.predict_proba(X_seg)[0][1])
                seg_scores.append(p_seg)
            if seg_scores:
                max_seg_scam = max(seg_scores)

        # 4. Multi-scale threat aggregation
        # - If an individual segment is an explicit scam/pharma trigger (>= 88%),
        #   it overrides legitimate padding text.
        # - If evasion tokens are detected (>= 2), boost threat score.
        final_threat = doc_spam
        if max_seg_scam >= 0.88:
            final_threat = max(final_threat, max_seg_scam)
        elif max_seg_scam >= 0.70 and doc_spam >= 0.30:
            final_threat = max(final_threat, max_seg_scam)

        if evasion_count >= 2:
            final_threat = max(final_threat, 0.85)

        # Bound probabilities
        scam_proba = float(np.clip(final_threat, 0.001, 0.999))
        legit_proba = float(1.0 - scam_proba)

        prediction = 1 if scam_proba >= 0.50 else 0
        status = "Scam" if prediction == 1 else "Legitimate (Ham)"
        confidence = scam_proba if prediction == 1 else legit_proba

        display_features = self.extract_display_features(
            subject=subject, body=body,
            sender=sender, num_attachments=num_attachments,
            evasion_tokens=evasion_count
        )

        return {
            "prediction": prediction,
            "status": status,
            "spam_probability": round(scam_proba * 100, 2),
            "ham_probability": round(legit_proba * 100, 2),
            "confidence": round(confidence * 100, 2),
            "features": display_features
        }

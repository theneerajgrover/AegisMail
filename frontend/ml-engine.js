/**
 * AegisMail Client-Side Machine Learning Engine
 * Provides 100% standalone in-browser spam & scam inference for GitHub Pages deployment.
 * Implements:
 * 1. Leetspeak & homoglyph de-obfuscation
 * 2. Word (1-2) + Subword Char-WB (3-5) TF-IDF feature extraction with exact L2 normalization
 * 3. Logistic Regression inference
 * 4. Multi-scale segment scanning (anti-poisoning defense)
 */

class InBrowserMLEngine {
  constructor() {
    this.model = null;
    this.isLoaded = false;
    this.leetMap = {
      '@': 'a', '0': 'o', '3': 'e', '4': 'a', '5': 's',
      '$': 's', '8': 'b', '+': 't'
    };
    this.urgentKeywords = [
      'urgent', 'immediately', 'act now', 'action required', 'expires',
      'suspended', 'critical', 'final notice', 'alert', 'time sensitive',
      'do not delay', 'warning', 'immediate attention', 'last chance'
    ];
    this.spamKeywords = [
      'free', 'winner', 'prize', 'lottery', 'cash', 'win', 'congratulations',
      'claim', 'bonus', '100% free', 'earn money', 'risk-free', 'investment opportunity',
      'selected', 'guaranteed', 'unclaimed', 'million dollars', 'giveaway',
      'prescriptions online', 'without doctor note', 'pharmacy', 'viagra', 'cialis'
    ];
    this.phishingKeywords = [
      'verify your account', 'password', 'credentials', 'bank account',
      'security alert', 'ssn', 'wire transfer', 'billing update', 'reset password',
      'unauthorized access', 'confirm identity', 'login below', 'drive link',
      'shared document', 'dropbox link', 'onedrive', 'look over the drive'
    ];
  }

  async loadModel(modelUrl = 'model_weights.json') {
    try {
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.model = await response.json();
      this.isLoaded = true;
      return true;
    } catch (err) {
      console.warn('InBrowserMLEngine: Could not load weights:', err);
      return false;
    }
  }

  deobfuscateToken(w) {
    if (/^\$?\d+([,\.]\d+)*%?$/.test(w)) return { clean: w, subs: 0 };
    const hasAlpha = /[a-zA-Z]/.test(w);
    let subs = 0;
    let res = '';
    for (let i = 0; i < w.length; i++) {
      const c = w[i];
      if (this.leetMap[c] && (hasAlpha || c === '@' || c === '$')) {
        res += this.leetMap[c];
        subs++;
      } else {
        res += c;
      }
    }
    return { clean: res, subs };
  }

  canonicalizeText(text) {
    const tokens = text.split(/\s+/);
    let totalSubs = 0;
    const cleanTokens = [];
    for (const t of tokens) {
      if (!t) continue;
      const { clean, subs } = this.deobfuscateToken(t);
      totalSubs += subs;
      cleanTokens.push(clean);
    }
    let res = cleanTokens.join(' ');
    const shorthands = [
      [/\bu\s+r\b/gi, 'you are'],
      [/\bu\b/gi, 'you'],
      [/\br\b/gi, 'are'],
      [/\bur\b/gi, 'your'],
      [/\bplz\b|\bpls\b/gi, 'please'],
      [/\bfr33\b|\bfreee+\b/gi, 'free'],
      [/\bw1n\b/gi, 'win'],
      [/\bcl@im\b|\bcla1m\b/gi, 'claim'],
      [/\bc@rd\b/gi, 'card'],
      [/\bt0\b/gi, 'to'],
      [/\bn0w\b/gi, 'now']
    ];
    for (const [pat, rep] of shorthands) {
      if (pat.test(res)) {
        totalSubs++;
        res = res.replace(pat, rep);
      }
    }
    return { cleanText: res, evasionCount: totalSubs };
  }

  scoreSegment(cleanText) {
    if (!this.model) return 0.5;
    const lower = cleanText.toLowerCase();

    // 1. Word unigrams & bigrams
    const rawTokens = lower.match(/\b\w\w+\b/g) || [];
    const wordCounts = {};
    for (let i = 0; i < rawTokens.length; i++) {
      const w = rawTokens[i];
      wordCounts[w] = (wordCounts[w] || 0) + 1;
      if (i < rawTokens.length - 1) {
        const bg = `${w} ${rawTokens[i + 1]}`;
        wordCounts[bg] = (wordCounts[bg] || 0) + 1;
      }
    }

    let wordDot = 0.0;
    let wordNormSq = 0.0;
    const wordEntries = this.model.words || {};
    const wordVals = [];
    for (const [w, count] of Object.entries(wordCounts)) {
      if (wordEntries[w]) {
        const [coef, idf] = wordEntries[w];
        const tf = 1.0 + Math.log(count);
        const tfidf = tf * idf;
        wordNormSq += tfidf * tfidf;
        wordVals.push({ coef, tfidf });
      }
    }
    const wordNorm = Math.sqrt(wordNormSq);
    if (wordNorm > 0) {
      for (const { coef, tfidf } of wordVals) {
        wordDot += coef * (tfidf / wordNorm);
      }
    }

    // 2. Char-wb 3 to 5 ngrams
    const charTokens = lower.match(/\b\w+\b/g) || [];
    const charCounts = {};
    for (const tok of charTokens) {
      const bounded = ` ${tok} `;
      const len = bounded.length;
      for (let n = 3; n <= 5; n++) {
        for (let i = 0; i <= len - n; i++) {
          const gram = bounded.substr(i, n);
          charCounts[gram] = (charCounts[gram] || 0) + 1;
        }
      }
    }

    let charDot = 0.0;
    let charNormSq = 0.0;
    const charEntries = this.model.chars || {};
    const charVals = [];
    for (const [ch, count] of Object.entries(charCounts)) {
      if (charEntries[ch]) {
        const [coef, idf] = charEntries[ch];
        const tf = 1.0 + Math.log(count);
        const tfidf = tf * idf;
        charNormSq += tfidf * tfidf;
        charVals.push({ coef, tfidf });
      }
    }
    const charNorm = Math.sqrt(charNormSq);
    if (charNorm > 0) {
      for (const { coef, tfidf } of charVals) {
        charDot += coef * (tfidf / charNorm);
      }
    }

    // 3. Sigmoid over intercept + wordDot + charDot
    const z = (this.model.intercept || 0.0) + wordDot + charDot;
    return 1.0 / (1.0 + Math.exp(-z));
  }

  extractDisplayFeatures(rawText, evasionCount) {
    const lower = rawText.toLowerCase();
    const clean = this.canonicalizeText(lower).cleanText;

    const urlPattern = /https?:\/\/\S+|www\.\S+|href=["']?[^"'>]+|\bdrive\s+link\b/gi;
    const numLinks = (rawText.match(urlPattern) || []).length;

    const hasUrgent = this.urgentKeywords.some(kw => lower.includes(kw) || clean.includes(kw)) ? 1 : 0;
    const hasSpam = (this.spamKeywords.some(kw => lower.includes(kw) || clean.includes(kw)) || evasionCount > 0) ? 1 : 0;
    const hasPhishing = this.phishingKeywords.some(kw => lower.includes(kw) || clean.includes(kw)) ? 1 : 0;
    const containsHtml = /<[a-z][\s\S]*>/i.test(rawText) ? 1 : 0;
    const numExclamations = (rawText.match(/!/g) || []).length;
    const words = rawText.match(/\b[A-Za-z]+\b/g) || [];
    const numUppercase = words.filter(w => w.length > 1 && w === w.toUpperCase()).length;

    return {
      num_links: numLinks,
      num_attachments: 0,
      has_urgent_words: hasUrgent,
      has_spam_words: hasSpam,
      has_phishing_words: hasPhishing,
      contains_html: containsHtml,
      email_length: rawText.length,
      num_exclamations: numExclamations,
      num_uppercase_words: numUppercase,
      evasion_tokens: evasionCount
    };
  }

  predict(subject = '', body = '', sender = '', numAttachments = 0) {
    const rawText = `${subject} ${body}`.trim() || ' ';
    const { cleanText, evasionCount } = this.canonicalizeText(rawText);

    // 1. Full document score
    const docSpam = this.scoreSegment(cleanText);

    // 2. Multi-segment scan (Anti-poisoning)
    const segments = rawText.split(/[\n\r]+|(?<=[.!?])\s+|\[.*?\]/)
      .map(s => s.trim())
      .filter(s => s.split(/\s+/).length >= 3);

    let maxSegScam = docSpam;
    if (segments.length > 0) {
      let maxScore = 0.0;
      for (const seg of segments) {
        const segClean = this.canonicalizeText(seg).cleanText;
        const sScore = this.scoreSegment(segClean);
        if (sScore > maxScore) maxScore = sScore;
      }
      maxSegScam = maxScore;
    }

    // 3. Calibrated Threat Fusion
    let threat = docSpam;
    if (maxSegScam >= 0.88) {
      threat = Math.max(threat, maxSegScam);
    } else if (maxSegScam >= 0.70 && docSpam >= 0.30) {
      threat = Math.max(threat, maxSegScam);
    }

    if (evasionCount >= 2) {
      threat = Math.max(threat, 0.85);
    }

    threat = Math.min(Math.max(threat, 0.001), 0.999);
    const scamProb = Math.round(threat * 10000) / 100;
    const hamProb = Math.round((1.0 - threat) * 10000) / 100;

    const prediction = threat >= 0.50 ? 1 : 0;
    const status = prediction === 1 ? 'Scam' : 'Legitimate (Ham)';
    const confidence = prediction === 1 ? scamProb : hamProb;

    const displayFeatures = this.extractDisplayFeatures(rawText, evasionCount);
    displayFeatures.num_attachments = numAttachments;

    return {
      success: true,
      prediction: prediction,
      status: status,
      spam_probability: scamProb,
      ham_probability: hamProb,
      confidence: confidence,
      features: displayFeatures,
      engine: 'client-in-browser'
    };
  }
}

// Attach to window or module
if (typeof window !== 'undefined') {
  window.InBrowserMLEngine = InBrowserMLEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InBrowserMLEngine };
}

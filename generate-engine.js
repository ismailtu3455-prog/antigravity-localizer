const fs = require('fs');
const path = require('path');

const tokenStatsPyContent = fs.readFileSync('token_stats.py', 'utf8');
const ruData = JSON.parse(fs.readFileSync('locales/ru.json', 'utf8'));
const ukData = JSON.parse(fs.readFileSync('locales/uk.json', 'utf8'));
const kkData = JSON.parse(fs.readFileSync('locales/kk.json', 'utf8'));
const beData = JSON.parse(fs.readFileSync('locales/be.json', 'utf8'));
const uzData = JSON.parse(fs.readFileSync('locales/uz.json', 'utf8'));
const deData = JSON.parse(fs.readFileSync('locales/de.json', 'utf8'));
const esData = JSON.parse(fs.readFileSync('locales/es.json', 'utf8'));
const frData = JSON.parse(fs.readFileSync('locales/fr.json', 'utf8'));
const trData = JSON.parse(fs.readFileSync('locales/tr.json', 'utf8'));

// Pre-compute reverse translation map: from any translated string in any language back to original English
const REVERSE_MAP = {};
for (const locale of [ruData, ukData, kkData, beData, uzData, deData, esData, frData, trData]) {
  if (locale && locale.exact) {
    for (const [enKey, transVal] of Object.entries(locale.exact)) {
      if (transVal && typeof transVal === 'string') {
        const trimmed = transVal.trim();
        REVERSE_MAP[trimmed] = enKey;
        REVERSE_MAP[trimmed.toLowerCase()] = enKey;
      }
    }
  }
}

const engineTemplate = `/**
 * Antigravity Hub & Localizer - Universal Multi-Language Engine + Native Tokens HUD
 * Fully integrated, persistent across reboots, zero external background processes.
 */
(function() {
  try {
    if (window.__AGENT_UI_LOCALIZER_INITIALIZED__) return;
    window.__AGENT_UI_LOCALIZER_INITIALIZED__ = true;

    console.log('[Agent-UI-Localizer] Starting multi-language translation engine & Tokens HUD...');

    const LOCALES = {
      ru: ${JSON.stringify(ruData, null, 2)},
      uk: ${JSON.stringify(ukData, null, 2)},
      kk: ${JSON.stringify(kkData, null, 2)},
      be: ${JSON.stringify(beData, null, 2)},
      uz: ${JSON.stringify(uzData, null, 2)},
      de: ${JSON.stringify(deData, null, 2)},
      es: ${JSON.stringify(esData, null, 2)},
      fr: ${JSON.stringify(frData, null, 2)},
      tr: ${JSON.stringify(trData, null, 2)}
    };

    const REVERSE_MAP = ${JSON.stringify(REVERSE_MAP, null, 2)};

    const LANG_NAMES = {
      ru: 'Русский',
      en: 'English',
      de: 'Deutsch',
      es: 'Español',
      fr: 'Français',
      tr: 'Türkçe',
      uk: 'Українська',
      kk: 'Қазақша',
      be: 'Беларуская',
      uz: 'O\\'zbekcha'
    };

    const TOAST_MSGS = {
      ru: '🇷🇺 Язык интерфейса: Русский',
      en: '🇬🇧 Interface language: English',
      de: '🇩🇪 Oberflächensprache: Deutsch',
      es: '🇪🇸 Idioma de la interfaz: Español',
      fr: '🇫🇷 Langue de l\\'interface: Français',
      tr: '🇹🇷 Arayüz dili: Türkçe',
      uk: '🇺🇦 Мова інтерфейсу: Українська',
      kk: '🇰🇿 Интерфейс тілі: Қазақша',
      be: '🇧🇾 Мова інтэрфейсу: Беларуская',
      uz: '🇺🇿 Interfeys tili: O\\'zbekcha'
    };

    // Fast case-insensitive lookup maps for each locale
    const LOWER_MAPS = {};
    for (const [langKey, langObj] of Object.entries(LOCALES)) {
      LOWER_MAPS[langKey] = {};
      if (langObj && langObj.exact) {
        for (const [k, v] of Object.entries(langObj.exact)) {
          LOWER_MAPS[langKey][k.toLowerCase()] = v;
        }
      }
    }

    // High quality SVG flags
    const FLAG_SVGS = {
      ru: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#ffffff" width="9" height="2"/><rect fill="#0039a6" y="2" width="9" height="2"/><rect fill="#d52b1e" y="4" width="9" height="2"/></svg>',
      uk: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#0057b7" width="9" height="3"/><rect fill="#ffd700" y="3" width="9" height="3"/></svg>',
      kk: '<svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="20" height="14" fill="#00afca"/><rect x="0" y="0" width="2" height="14" fill="#fec50c"/><circle cx="11" cy="6" r="2.5" fill="#fec50c"/><path d="M7.5 9.5 Q11 8 14.5 9.5 Q11 9 7.5 9.5 Z" fill="#fec50c"/></svg>',
      be: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#c8313e" width="9" height="4"/><rect fill="#4aa658" y="4" width="9" height="2"/><rect fill="#ffffff" width="1.5" height="6"/></svg>',
      uz: '<svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#0099b5" width="20" height="4.4"/><rect fill="#ce1126" y="4.4" width="20" height="0.6"/><rect fill="#ffffff" y="5.0" width="20" height="4.0"/><rect fill="#ce1126" y="9.0" width="20" height="0.6"/><rect fill="#1eb53a" y="9.6" width="20" height="4.4"/><circle cx="3" cy="2.2" r="1.3" fill="#ffffff"/><circle cx="3.5" cy="2.2" r="1.1" fill="#0099b5"/></svg>',
      en: '<svg width="20" height="14" viewBox="0 0 60 30" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><clipPath id="uk-f-c"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="uk-f-d"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#uk-f-c)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-f-d)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
      de: '<svg width="20" height="14" viewBox="0 0 5 3" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
      es: '<svg width="20" height="14" viewBox="0 0 750 500" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="750" height="500" fill="#c60b1e"/><rect y="125" width="750" height="250" fill="#ffc400"/></svg>',
      fr: '<svg width="20" height="14" viewBox="0 0 3 2" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ed2939"/></svg>',
      tr: '<svg width="20" height="14" viewBox="0 0 1200 800" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="1200" height="800" fill="#E30A17"/><circle cx="425" cy="400" r="200" fill="#ffffff"/><circle cx="475" cy="400" r="160" fill="#E30A17"/><polygon fill="#ffffff" points="583,400 665,426 614,357 614,443 665,374"/></svg>'
    };

    // Node persistent disk storage resolution
    let nodeFs = null;
    let nodePath = null;
    let nodeOs = null;
    let nodeChildProcess = null;
    let storageDirs = [];

    try {
      if (typeof require === 'function') {
        nodeFs = require('fs');
        nodePath = require('path');
        try { nodeOs = require('os'); } catch (_) {}
        try { nodeChildProcess = require('child_process'); } catch (_) {}
        const os = nodeOs;
        const home = os && os.homedir ? os.homedir() : (process.env.USERPROFILE || process.env.HOME || '');
        if (home) {
          storageDirs.push(nodePath.join(home, '.gemini'));
        }
        if (process.env.APPDATA) {
          storageDirs.push(nodePath.join(process.env.APPDATA, 'Antigravity'));
        }
        if (process.env.LOCALAPPDATA) {
          storageDirs.push(nodePath.join(process.env.LOCALAPPDATA, 'Programs', 'antigravity', 'resources'));
        }

        for (const dir of storageDirs) {
          try {
            if (!nodeFs.existsSync(dir)) nodeFs.mkdirSync(dir, { recursive: true });
          } catch (_) {}
        }

        // Dynamically load custom user-generated AI locales from ~/.gemini/custom_locales/
        if (home) {
          const customLocalesDir = nodePath.join(home, '.gemini', 'custom_locales');
          if (nodeFs.existsSync(customLocalesDir)) {
            const files = nodeFs.readdirSync(customLocalesDir);
            for (const f of files) {
              if (f.endsWith('.json')) {
                try {
                  const code = f.replace('.json', '').toLowerCase();
                  const jsonContent = JSON.parse(nodeFs.readFileSync(nodePath.join(customLocalesDir, f), 'utf8'));
                  const flagDisplay = (jsonContent.flag && typeof jsonContent.flag === 'string' && jsonContent.flag.trim()) ? jsonContent.flag.trim() : '🌐';
                  LOCALES[code] = jsonContent;
                  LANG_NAMES[code] = jsonContent.name;
                  TOAST_MSGS[code] = flagDisplay + ' ' + jsonContent.name;
                  FLAG_SVGS[code] = '<span style="font-size:16px;line-height:1;display:inline-block;pointer-events:none;vertical-align:middle;">' + flagDisplay + '</span>';
                  LOWER_MAPS[code] = {};
                  for (const [k, v] of Object.entries(jsonContent.exact)) {
                    LOWER_MAPS[code][k.toLowerCase()] = v;
                    if (v && typeof v === 'string') {
                      const trimmed = v.trim();
                      REVERSE_MAP[trimmed] = k;
                      REVERSE_MAP[trimmed.toLowerCase()] = k;
                    }
                  }
                  console.log('[Agent-UI-Localizer] Loaded custom locale:', code, jsonContent.name);
                } catch (e) {
                  console.warn('[Agent-UI-Localizer] Failed loading custom locale:', f, e);
                }
              }
            }
          }
        }
      }
    } catch (_) {}

    function getSavedLang() {
      // 1. Check all disk file locations
      try {
        if (nodeFs && nodePath) {
          for (const dir of storageDirs) {
            const langFile = nodePath.join(dir, 'agent_ui_lang.txt');
            if (nodeFs.existsSync(langFile)) {
              const content = nodeFs.readFileSync(langFile, 'utf8').trim().toLowerCase();
              if (content && (LOCALES[content] || content === 'en')) {
                return content;
              }
            }
          }
        }
      } catch (_) {}

      // 2. Check localStorage
      try {
        const stored = window.localStorage && window.localStorage.getItem('agent_ui_lang');
        if (stored && (LOCALES[stored] || stored === 'en')) {
          return stored;
        }
      } catch (_) {}

      return 'ru';
    }

    function saveLang(lang) {
      try {
        if (nodeFs && nodePath) {
          for (const dir of storageDirs) {
            try {
              const langFile = nodePath.join(dir, 'agent_ui_lang.txt');
              nodeFs.writeFileSync(langFile, lang, 'utf8');
            } catch (_) {}
          }
        }
      } catch (_) {}
      try {
        if (window.localStorage) {
          window.localStorage.setItem('agent_ui_lang', lang);
        }
      } catch (_) {}
    }

    let currentLang = getSavedLang();
    let isTranslating = false;
    const originalTexts = new WeakMap();
    const originalAttrs = new WeakMap();

    // Resolves any text back to canonical English
    function resolveCanonicalEnglish(text) {
      if (!text || typeof text !== 'string') return null;
      const trimmed = text.trim();
      if (!trimmed) return null;

      // 1. Exact match in English keys
      if (LOCALES.ru && LOCALES.ru.exact && LOCALES.ru.exact[trimmed]) return trimmed;

      // 2. Trailing colon
      if (trimmed.endsWith(':')) {
        const withoutColon = trimmed.slice(0, -1).trim();
        if (LOCALES.ru && LOCALES.ru.exact && LOCALES.ru.exact[withoutColon]) return trimmed;
        if (REVERSE_MAP[withoutColon]) return REVERSE_MAP[withoutColon] + ':';
      }

      // 3. Reverse map
      if (REVERSE_MAP[trimmed]) return REVERSE_MAP[trimmed];
      if (REVERSE_MAP[trimmed.toLowerCase()]) return REVERSE_MAP[trimmed.toLowerCase()];

      return trimmed;
    }

    function getTranslation(canonicalText, targetLang) {
      if (!canonicalText || typeof canonicalText !== 'string') return null;
      const lang = targetLang || currentLang;
      if (lang === 'en') return canonicalText;

      const trimmed = canonicalText.trim();
      if (!trimmed) return null;

      const locale = LOCALES[lang] || LOCALES.ru;
      const lowerMap = LOWER_MAPS[lang] || LOWER_MAPS.ru;

      const leadingSpace = canonicalText.match(/^\\s*/)[0];
      const trailingSpace = canonicalText.match(/\\s*$/)[0];

      // 1. Exact match in target locale
      if (locale && locale.exact && locale.exact[trimmed]) {
        return leadingSpace + locale.exact[trimmed] + trailingSpace;
      }

      // 2. Trailing colon handling
      if (trimmed.endsWith(':')) {
        const withoutColon = trimmed.slice(0, -1).trim();
        if (locale && locale.exact && locale.exact[withoutColon]) {
          return leadingSpace + locale.exact[withoutColon] + ':' + trailingSpace;
        }
        if (lowerMap && lowerMap[withoutColon.toLowerCase()]) {
          return leadingSpace + lowerMap[withoutColon.toLowerCase()] + ':' + trailingSpace;
        }
      }

      // 3. Case-insensitive match in target locale
      const lower = trimmed.toLowerCase();
      if (lowerMap && lowerMap[lower]) {
        return leadingSpace + lowerMap[lower] + trailingSpace;
      }

      // 4. Pattern regex match
      if (locale && locale.patterns) {
        for (const pat of locale.patterns) {
          try {
            const reg = new RegExp(pat.regex, 'i');
            if (reg.test(trimmed)) {
              const trans = trimmed.replace(reg, pat.replace);
              return leadingSpace + trans + trailingSpace;
            }
          } catch (_) {}
        }
      }

      // 5. Fallback to Russian if missing in another locale
      if (lang !== 'ru' && LOCALES.ru) {
        if (LOCALES.ru.exact && LOCALES.ru.exact[trimmed]) {
          return leadingSpace + LOCALES.ru.exact[trimmed] + trailingSpace;
        }
        if (LOWER_MAPS.ru && LOWER_MAPS.ru[lower]) {
          return leadingSpace + LOWER_MAPS.ru[lower] + trailingSpace;
        }
      }

      return null;
    }

    function translateElementAttrs(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.id === 'agent-ui-lang-switcher' || node.id === 'agent-ui-lang-menu' || node.id === 'agent-ui-toast' || node.id === 'antigravity-token-widget' || node.closest?.('#agent-ui-lang-switcher') || node.closest?.('#agent-ui-lang-menu') || node.closest?.('#antigravity-token-widget')) return;

      const attrs = ['placeholder', 'title', 'aria-label'];
      for (const attr of attrs) {
        if (node.hasAttribute && node.hasAttribute(attr)) {
          const val = node.getAttribute(attr);
          if (val) {
            let origMap = originalAttrs.get(node);
            if (!origMap) {
              origMap = {};
              originalAttrs.set(node, origMap);
            }
            if (!origMap[attr]) {
              origMap[attr] = resolveCanonicalEnglish(val);
            }
            const canon = origMap[attr];
            if (currentLang === 'en') {
              if (node.getAttribute(attr) !== canon) {
                node.setAttribute(attr, canon);
              }
            } else {
              const trans = getTranslation(canon, currentLang);
              if (trans && trans !== val) {
                node.setAttribute(attr, trans);
              }
            }
          }
        }
      }
    }

    function translateTextNode(node) {
      if (!node || node.nodeType !== 3) return;
      const parent = node.parentElement;
      if (parent) {
        const tag = parent.tagName?.toLowerCase();
        if (tag === 'code' || tag === 'pre' || tag === 'script' || tag === 'style') return;
        if (parent.id === 'agent-ui-lang-switcher' || parent.id === 'agent-ui-lang-menu' || parent.id === 'agent-ui-toast' || parent.id === 'antigravity-token-widget' || parent.closest?.('#agent-ui-lang-switcher') || parent.closest?.('#agent-ui-lang-menu') || parent.closest?.('#antigravity-token-widget')) return;
      }

      const val = node.nodeValue;
      if (!val || !val.trim()) return;

      let canon = originalTexts.get(node);
      if (!canon) {
        canon = resolveCanonicalEnglish(val);
        originalTexts.set(node, canon);
      }

      if (currentLang === 'en') {
        if (node.nodeValue !== canon) {
          node.nodeValue = canon;
        }
      } else {
        const trans = getTranslation(canon, currentLang);
        if (trans && trans !== val) {
          node.nodeValue = trans;
        }
      }
    }

    function walk(node) {
      if (!node) return;
      if (node.nodeType === 3) {
        translateTextNode(node);
        return;
      }
      if (node.nodeType === 1) {
        if (node.id === 'agent-ui-lang-switcher' || node.id === 'agent-ui-lang-menu' || node.id === 'agent-ui-toast' || node.id === 'antigravity-token-widget' || node.closest?.('#agent-ui-lang-switcher') || node.closest?.('#agent-ui-lang-menu') || node.closest?.('#antigravity-token-widget')) return;
        const tag = node.tagName?.toLowerCase();
        if (tag === 'code' || tag === 'pre' || tag === 'script' || tag === 'style') return;

        translateElementAttrs(node);

        let child = node.firstChild;
        while (child) {
          walk(child);
          child = child.nextSibling;
        }
      }
    }

    function walkAndTranslate(rootNode) {
      if (!rootNode) return;
      isTranslating = true;
      try {
        walk(rootNode);
      } catch (e) {
        console.error('[Agent-UI-Localizer] Walk error:', e);
      } finally {
        isTranslating = false;
      }
    }

    const observer = new MutationObserver(function(mutations) {
      if (isTranslating) return;
      isTranslating = true;
      try {
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (m.type === 'childList') {
            for (let j = 0; j < m.addedNodes.length; j++) {
              walk(m.addedNodes[j]);
            }
          } else if (m.type === 'characterData') {
            translateTextNode(m.target);
          } else if (m.type === 'attributes') {
            translateElementAttrs(m.target);
          }
        }
      } finally {
        isTranslating = false;
      }
    });

    function showToast(msg) {
      try {
        let toast = document.getElementById('agent-ui-toast');
        if (!toast) {
          toast = document.createElement('div');
          toast.id = 'agent-ui-toast';
          toast.style.cssText = \`
            position: fixed !important;
            top: 24px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 2147483647 !important;
            background: #18181b !important;
            color: #ffffff !important;
            border: 1px solid #3f3f46 !important;
            border-radius: 8px !important;
            padding: 8px 18px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7) !important;
            transition: opacity 0.3s ease !important;
            pointer-events: none !important;
          \`;
          document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => {
          if (toast) toast.style.opacity = '0';
        }, 1800);
      } catch (_) {}
    }

    function setLanguage(lang) {
      currentLang = lang;
      saveLang(currentLang);
      updateSwitcherUI();
      walkAndTranslate(document.body);
      if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
        window.__AGY_RENDER_TOKENS_HUD__();
      }
      showToast(TOAST_MSGS[currentLang] || ('Язык: ' + (LANG_NAMES[currentLang] || currentLang)));
    }

    function updateSwitcherUI() {
      const btn = document.getElementById('agent-ui-lang-switcher');
      if (!btn) return;
      const flagSvg = FLAG_SVGS[currentLang] || FLAG_SVGS.ru;
      const caretSvg = '<svg width="8" height="6" viewBox="0 0 8 6" style="opacity:0.75;display:block;pointer-events:none;"><path d="M1 1.5L4 4.5L7 1.5" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>';
      btn.innerHTML = \`<span style="display:inline-flex;align-items:center;gap:4px;pointer-events:none;">\${flagSvg}\${caretSvg}</span>\`;
      btn.title = 'Язык / Мова / Тіл: ' + (LANG_NAMES[currentLang] || 'Русский') + ' (Нажмите для выбора языка)';
    }

    function toggleLangMenu(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const existing = document.getElementById('agent-ui-lang-menu');
      if (existing) {
        existing.remove();
        return;
      }

      const btn = document.getElementById('agent-ui-lang-switcher');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const menu = document.createElement('div');
      menu.id = 'agent-ui-lang-menu';
      menu.style.cssText = \`
        position: fixed !important;
        top: \${rect.bottom + 6}px !important;
        left: \${Math.max(8, rect.left - 20)}px !important;
        z-index: 2147483647 !important;
        background: #18181b !important;
        color: #f4f4f5 !important;
        border: 1px solid #3f3f46 !important;
        border-radius: 8px !important;
        padding: 6px !important;
        min-width: 185px !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8) !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 13px !important;
        -webkit-app-region: no-drag !important;
        pointer-events: auto !important;
      \`;

      const header = document.createElement('div');
      header.style.cssText = \`
        padding: 4px 8px 6px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        color: #a1a1aa !important;
        letter-spacing: 0.5px !important;
        border-bottom: 1px solid #27272a !important;
        margin-bottom: 4px !important;
      \`;
      header.textContent = 'Язык / Мова / Тіл';
      menu.appendChild(header);

      const LANG_LIST = [
        { code: 'ru', name: 'Русский', native: 'Русский' },
        { code: 'en', name: 'Английский', native: 'English' },
        { code: 'de', name: 'Немецкий', native: 'Deutsch' },
        { code: 'es', name: 'Испанский', native: 'Español' },
        { code: 'fr', name: 'Французский', native: 'Français' },
        { code: 'tr', name: 'Турецкий', native: 'Türkçe' },
        { code: 'uk', name: 'Украинский', native: 'Українська' },
        { code: 'kk', name: 'Казахский', native: 'Қазақша' },
        { code: 'be', name: 'Белорусский', native: 'Беларуская' },
        { code: 'uz', name: 'Узбекский', native: 'O\\'zbekcha' }
      ];

      LANG_LIST.forEach(item => {
        const row = document.createElement('div');
        const isSelected = (currentLang === item.code);
        row.style.cssText = \`
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 6px 10px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          color: \${isSelected ? '#ffffff' : '#e4e4e7'} !important;
          background: \${isSelected ? '#27272a' : 'transparent'} !important;
          font-weight: \${isSelected ? '600' : '400'} !important;
          transition: background 0.12s ease !important;
          user-select: none !important;
        \`;

        row.onmouseenter = () => {
          if (!isSelected) row.style.background = '#27272a';
        };
        row.onmouseleave = () => {
          if (!isSelected) row.style.background = 'transparent';
        };

        const left = document.createElement('div');
        left.style.cssText = 'display: flex !important; align-items: center !important; gap: 10px !important; pointer-events: none !important;';

        const flagSpan = document.createElement('span');
        flagSpan.innerHTML = FLAG_SVGS[item.code] || '';
        left.appendChild(flagSpan);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = item.native;
        left.appendChild(nameSpan);

        row.appendChild(left);

        if (isSelected) {
          const check = document.createElement('span');
          check.textContent = '✓';
          check.style.cssText = 'color: #3b82f6 !important; font-weight: bold !important; margin-left: 12px !important; font-size: 14px !important;';
          row.appendChild(check);
        }

        row.addEventListener('click', function(evt) {
          evt.stopPropagation();
          setLanguage(item.code);
          menu.remove();
        });

        menu.appendChild(row);
      });

      document.body.appendChild(menu);

      function closeMenu(evt) {
        if (!menu.contains(evt.target) && evt.target !== btn && !btn.contains(evt.target)) {
          menu.remove();
          window.removeEventListener('pointerdown', closeMenu, true);
        }
      }
      window.addEventListener('pointerdown', closeMenu, true);
    }

    function findNavContainer() {
      const fwd = document.querySelector('button[aria-label="Go Forward"], button[title="Go Forward"], button[aria-label="Вперед"], button[title="Вперед"], button[aria-label*="Forward"], button[aria-label*="Вперед"], button[aria-label*="Попередня"]');
      if (fwd && fwd.parentElement) return fwd.parentElement;

      const symbols = document.querySelectorAll('button span, button i');
      for (const s of symbols) {
        if (s.textContent?.trim() === 'arrow_forward' && s.closest('button')) {
          const b = s.closest('button');
          if (b.parentElement) return b.parentElement;
        }
      }

      const sb = document.querySelector('[data-testid="sidebar-toggle"]');
      if (sb && sb.parentElement) return sb.parentElement;

      return null;
    }

    function injectLanguageSwitcher() {
      try {
        let btn = document.getElementById('agent-ui-lang-switcher');
        if (!btn) {
          btn = document.createElement('button');
          btn.id = 'agent-ui-lang-switcher';
          btn.type = 'button';
          btn.style.cssText = \`
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 28px !important;
            padding: 0 6px !important;
            margin: 0 0 0 6px !important;
            background: transparent !important;
            border: 1px solid transparent !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            user-select: none !important;
            -webkit-app-region: no-drag !important;
            pointer-events: auto !important;
            transition: all 0.15s ease !important;
            opacity: 0.9 !important;
            outline: none !important;
            flex-shrink: 0 !important;
          \`;

          btn.onmouseenter = () => {
            btn.style.background = 'rgba(255, 255, 255, 0.12)';
            btn.style.opacity = '1';
          };
          btn.onmouseleave = () => {
            btn.style.background = 'transparent';
            btn.style.opacity = '0.9';
          };
          btn.onmousedown = () => {
            btn.style.transform = 'scale(0.94)';
          };
          btn.onmouseup = () => {
            btn.style.transform = 'scale(1)';
          };

          btn.addEventListener('click', toggleLangMenu);

          const btnObserver = new MutationObserver(() => {
            if (!btn.hasChildNodes() || btn.innerHTML.trim() === '') {
              updateSwitcherUI();
            }
          });
          btnObserver.observe(btn, { childList: true });
        }

        updateSwitcherUI();

        const navContainer = findNavContainer();
        if (navContainer) {
          if (btn.parentElement !== navContainer) {
            navContainer.appendChild(btn);
            btn.style.position = 'relative';
            btn.style.top = 'auto';
            btn.style.left = 'auto';
            btn.style.zIndex = 'auto';
          }
          return;
        }

        if (btn.parentElement !== document.body && document.body) {
          btn.style.position = 'fixed';
          btn.style.top = '7px';
          btn.style.left = '154px';
          btn.style.zIndex = '2147483647';
          document.body.appendChild(btn);
        }
      } catch (err) {
        console.error('[Agent-UI-Localizer] Switcher error:', err);
      }
    }

    // ================= NATIVE INTEGRATED TOKENS HUD =================
    const EMBEDDED_TOKEN_STATS_PY = ${JSON.stringify(tokenStatsPyContent)};
    let lastTokenData = null;
    let isFetchingTokens = false;
    let lastTokenFetchTime = 0;

    // Load initial token stats synchronously from ~/.gemini/token_stats.json if available
    try {
      if (nodeFs && nodePath) {
        const homeDir = (nodeOs && nodeOs.homedir) ? nodeOs.homedir() : (process.env.USERPROFILE || process.env.HOME || '');
        const cacheFile = nodePath.join(homeDir, '.gemini', 'token_stats.json');
        if (nodeFs.existsSync(cacheFile)) {
          lastTokenData = JSON.parse(nodeFs.readFileSync(cacheFile, 'utf8'));
        }
      }
    } catch (_) {}

    function isHudEnabled() {
      try {
        if (nodeFs && nodePath) {
          for (const dir of storageDirs) {
            const f = nodePath.join(dir, 'agent_tokens_hud.txt');
            if (nodeFs.existsSync(f)) {
              const val = nodeFs.readFileSync(f, 'utf8').trim().toLowerCase();
              if (val === 'false' || val === '0' || val === 'disabled' || val === 'off') return false;
            }
          }
        }
      } catch (_) {}
      try {
        const ls = window.localStorage && window.localStorage.getItem('agent_tokens_hud');
        if (ls === 'false' || ls === '0' || ls === 'disabled' || ls === 'off') return false;
      } catch (_) {}
      return true;
    }

    function fmtK(n) {
      if (!n || n <= 0) return '0';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return Math.round(n / 1000) + 'k';
      return n + '';
    }

    function formatResetTime(seconds) {
      if (!seconds) return '';
      const sec = parseInt(seconds, 10);
      if (isNaN(sec)) return '';
      const diff = sec - Math.floor(Date.now() / 1000);
      if (diff <= 0) {
        return currentLang === 'en' ? 'now' : 'сейчас';
      }
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);

      const dStr = currentLang === 'en' ? 'd' : 'д';
      const hStr = currentLang === 'en' ? 'h' : 'ч';
      const mStr = currentLang === 'en' ? 'm' : 'м';

      if (days > 0) return \`\${days}\${dStr} \${hours}\${hStr}\`;
      if (hours > 0) return \`\${hours}\${hStr} \${mins}\${mStr}\`;
      return \`\${mins}\${mStr}\`;
    }

    function getActiveConvId() {
      try {
        if (window.__TSR_ROUTER__?.state) {
          const matches = window.__TSR_ROUTER__.state.matches || [];
          for (let i = matches.length - 1; i >= 0; i--) {
            const cid = matches[i]?.params?.cascadeId;
            if (cid) return cid;
          }
          const pathname = window.__TSR_ROUTER__.state.location?.pathname || '';
          const parts = pathname.split('/');
          const idx = parts.indexOf('c');
          if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
        }
        const mainChat = document.querySelector('div:not([data-testid="conversation-row-sidebar"])[data-cascade-id]');
        if (mainChat) {
          const id = mainChat.getAttribute('data-cascade-id');
          if (id) return id;
        }
        const selRow = document.querySelector('[data-selected="true"][data-cascade-id]') || document.querySelector('[data-selected="true"]');
        if (selRow) {
          const id = selRow.getAttribute('data-cascade-id');
          if (id) return id;
        }
        const parts = window.location.pathname.split('/');
        const idx = parts.indexOf('c');
        if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      } catch (_) {}
      return null;
    }

    function getActiveModelName() {
      try {
        const btns = Array.from(document.querySelectorAll('button'));
        const modelBtn = btns.find(b => b.textContent && (b.textContent.includes('Gemini') || b.textContent.includes('Claude') || b.textContent.includes('GPT') || b.textContent.includes('DeepSeek')));
        if (modelBtn) {
          const txt = modelBtn.innerText.replace(/\\s+/g, ' ').trim();
          const m = txt.match(/(Gemini\\s+[\\d.]+\\s+\\w+|Claude\\s+[\\w\\s.]+|GPT-[\\w\\s.]+|DeepSeek\\s+[\\w\\s.]+)/i);
          if (m) return m[1];
          return txt.split(' ')[0];
        }
      } catch (_) {}
      return 'Gemini 3.7 Flash';
    }

    function getMaxContextForModel(modelName) {
      const m = (modelName || '').toLowerCase();
      if (m.includes('claude')) return 200000;
      if (m.includes('gpt-4o') || m.includes('gpt-4')) return 128000;
      return 1000000;
    }

    function findTokenStatsScript() {
      try {
        if (!nodeFs || !nodePath) return null;
        const homeDir = (nodeOs && nodeOs.homedir) ? nodeOs.homedir() : (process.env.USERPROFILE || process.env.HOME || '');
        const candidates = [
          nodePath.join(process.resourcesPath || '', 'token_stats.py'),
          nodePath.join(__dirname || '', 'token_stats.py'),
          nodePath.join(homeDir, '.gemini', 'token_stats.py'),
          nodePath.join(homeDir, '.antigravity-tokens-hud', 'token_stats.py'),
          'C:\\\\Users\\\\ismai\\\\AppData\\\\Local\\\\Programs\\\\antigravity\\\\resources\\\\token_stats.py',
          'C:\\\\Users\\\\ismai\\\\.gemini\\\\token_stats.py'
        ];
        for (const p of candidates) {
          if (p && nodeFs.existsSync(p)) return p;
        }
        if (homeDir && EMBEDDED_TOKEN_STATS_PY) {
          const autoPath = nodePath.join(homeDir, '.gemini', 'token_stats.py');
          try {
            nodeFs.writeFileSync(autoPath, EMBEDDED_TOKEN_STATS_PY, 'utf8');
            return autoPath;
          } catch (_) {}
        }
      } catch (_) {}
      return null;
    }

    function runTokenStatsScript(scriptPath, args, callback) {
      if (!nodeChildProcess) {
        callback(new Error('child_process unavailable'), null);
        return;
      }
      const binaries = process.platform === 'win32'
        ? ['python', 'py', 'python3', nodePath.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'python.exe')]
        : ['python3', 'python'];
      let idx = 0;

      function tryNext() {
        if (idx >= binaries.length) {
          callback(new Error('Python not found'), null);
          return;
        }
        const bin = binaries[idx++];
        const env = { ...process.env };
        if (process.platform !== 'win32') {
          env.PATH = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', process.env.PATH || ''].join(':');
        }
        try {
          nodeChildProcess.execFile(bin, [scriptPath, ...args], { windowsHide: true, timeout: 6000, env }, (err, stdout) => {
            if (err && (err.code === 'ENOENT' || !stdout)) {
              tryNext();
            } else {
              callback(err, stdout);
            }
          });
        } catch (_) {
          tryNext();
        }
      }

      tryNext();
    }

    function refreshTokenStats(force = false) {
      const now = Date.now();
      if (!force && isFetchingTokens) return;
      if (!force && (now - lastTokenFetchTime < 2500)) return;

      isFetchingTokens = true;
      lastTokenFetchTime = now;

      try {
        const scriptPath = findTokenStatsScript();
        if (!scriptPath) {
          isFetchingTokens = false;
          return;
        }

        const activeId = getActiveConvId();
        const args = ['--json'];
        if (activeId) {
          args.push('--session', activeId);
        }

        runTokenStatsScript(scriptPath, args, (err, stdout) => {
          isFetchingTokens = false;
          if (err || !stdout) return;
          try {
            const parsed = JSON.parse(stdout);
            if (parsed && (parsed.current_session || parsed.sessions)) {
              lastTokenData = parsed;
              window.__AGY_DATA__ = parsed;

              try {
                if (nodeFs && nodePath) {
                  const homeDir = (nodeOs && nodeOs.homedir) ? nodeOs.homedir() : (process.env.USERPROFILE || process.env.HOME || '');
                  const cacheFile = nodePath.join(homeDir, '.gemini', 'token_stats.json');
                  nodeFs.writeFileSync(cacheFile, JSON.stringify(parsed), 'utf8');
                }
              } catch (_) {}

              if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
                window.__AGY_RENDER_TOKENS_HUD__();
              }
            }
          } catch (_) {}
        });
      } catch (_) {
        isFetchingTokens = false;
      }
    }

    async function fetchOfficialQuotas() {
      try {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const fk = Object.keys(btn).find(k => k.startsWith('__reactFiber'));
          if (!fk) continue;
          let cur = btn[fk];
          while (cur) {
            if (cur.memoizedProps?.value?.retrieveUserQuotaSummary) {
              return await cur.memoizedProps.value.retrieveUserQuotaSummary({});
            }
            cur = cur.return;
          }
        }
      } catch (_) {}
      return null;
    }

    const HUD_LABELS = {
      ru: { h5: '5-часовой', weekly: 'Недельный', tip5h: 'Остаток 5-часового лимита', tipWk: 'Остаток недельного лимита', reset: 'сброс через', ctx: 'Контекст' },
      uk: { h5: '5-годинний', weekly: 'Тижневий', tip5h: 'Залишок 5-годинного ліміту', tipWk: 'Залишок тижневого ліміту', reset: 'скидання через', ctx: 'Контекст' },
      kk: { h5: '5-сағаттық', weekly: 'Апталық', tip5h: '5-сағаттық лимит қалдығы', tipWk: 'Апталық лимит қалдығы', reset: 'қалған уақыт', ctx: 'Мәнмәтін' },
      be: { h5: '5-гадзінны', weekly: 'Тыднёвы', tip5h: 'Рэштка 5-гадзіннага ліміту', tipWk: 'Рэштка тыднёвага ліміту', reset: 'скід праз', ctx: 'Кантэкст' },
      uz: { h5: '5-soatlik', weekly: 'Haftalik', tip5h: '5-soatlik limit qoldig\\'i', tipWk: 'Haftalik limit qoldig\\'i', reset: 'yangilanish', ctx: 'Kontekst' },
      en: { h5: '5-Hour', weekly: 'Weekly', tip5h: '5-Hour limit remaining', tipWk: 'Weekly limit remaining', reset: 'reset in', ctx: 'Context' },
      de: { h5: '5-Stunden', weekly: 'Wöchentlich', tip5h: '5-Stunden-Limit verbleibend', tipWk: 'Wöchentliches Limit verbleibend', reset: 'Reset in', ctx: 'Kontext' },
      es: { h5: '5-Horas', weekly: 'Semanal', tip5h: 'Límite de 5 horas restante', tipWk: 'Límite semanal restante', reset: 'reinicio en', ctx: 'Contexto' },
      fr: { h5: '5-Heures', weekly: 'Hebdomadaire', tip5h: 'Limite 5h restante', tipWk: 'Limite hebdomadaire restante', reset: 'réinitialisation dans', ctx: 'Contexte' },
      tr: { h5: '5-Saatlik', weekly: 'Haftalık', tip5h: '5 saatlik kalan limit', tipWk: 'Haftalık kalan limit', reset: 'sıfırlanma', ctx: 'Bağlam' }
    };

    window.__AGY_RENDER_TOKENS_HUD__ = async function() {
      try {
        if (!isHudEnabled()) {
          const oldWidget = document.getElementById('antigravity-token-widget');
          if (oldWidget) oldWidget.remove();
          return;
        }

        // Find settings button in left sidebar
        const allButtons = Array.from(document.querySelectorAll('button'));
        const settingsBtn = allButtons.find(b => {
          const t = (b.textContent || '').trim();
          const al = (b.getAttribute('aria-label') || '').trim();
          const title = (b.getAttribute('title') || '').trim();
          return t.includes('Settings') || t.includes('Настройки') || t.includes('Налаштування') || t.includes('Баптаулар') ||
                 al.includes('Settings') || al.includes('Настройки') ||
                 title.includes('Settings') || title.includes('Настройки');
        });

        if (!settingsBtn || !settingsBtn.parentElement) return;

        let container = document.getElementById('antigravity-token-widget');
        if (!container) {
          container = document.createElement('div');
          container.id = 'antigravity-token-widget';
          container.style.cssText = \`
            padding: 8px 10px !important;
            margin: 4px 8px 8px 8px !important;
            border-radius: 8px !important;
            background: rgba(255, 255, 255, 0.035) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
            color: rgba(255, 255, 255, 0.85) !important;
            user-select: none !important;
            cursor: pointer !important;
            transition: border-color 0.2s ease, background 0.2s ease !important;
            box-sizing: border-box !important;
          \`;

          container.onmouseenter = () => {
            container.style.borderColor = 'rgba(255, 255, 255, 0.18)';
            container.style.background = 'rgba(255, 255, 255, 0.055)';
          };
          container.onmouseleave = () => {
            container.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            container.style.background = 'rgba(255, 255, 255, 0.035)';
          };

          settingsBtn.parentElement.insertBefore(container, settingsBtn);
        }

        container.onclick = (e) => {
          e.stopPropagation();
          refreshTokenStats(true);
        };

        const activeId = getActiveConvId();
        const modelName = getActiveModelName();
        const quotaData = await fetchOfficialQuotas();
        const labels = HUD_LABELS[currentLang] || HUD_LABELS.ru;

        // Context token metrics
        let session = null;
        const data = lastTokenData || window.__AGY_DATA__;
        if (data) {
          if (data.sessions && activeId && data.sessions[activeId]) {
            session = data.sessions[activeId];
          } else if (activeId && data.current_session && data.current_session.session_id === activeId) {
            session = data.current_session;
          } else if (!activeId && data.current_session) {
            session = data.current_session;
          } else if (data.sessions) {
            const sKeys = Object.keys(data.sessions);
            if (sKeys.length > 0) {
              session = data.sessions[sKeys[0]];
            }
          }
        }

        if (!session) {
          session = {
            session_id: activeId || 'new',
            context_size: 0,
            max_context: getMaxContextForModel(modelName),
            context_percent: 0.0,
            cached_tokens: 0,
            prompt_tokens: 0
          };
        }

        const ctxSize = session.context_size || 0;
        const maxCtx = session.max_context || getMaxContextForModel(modelName);
        const ctxPct = (session.context_percent != null) ? session.context_percent : ((ctxSize / maxCtx) * 100);
        const ctxBarWidth = Math.min(100, Math.max(0, ctxPct));
        const ctxK = fmtK(ctxSize);
        const maxK = maxCtx >= 1000000 ? (maxCtx / 1000000).toFixed(0) + 'M' : fmtK(maxCtx);
        const ctxColor = ctxPct > 75 ? '#ef4444' : (ctxPct > 45 ? '#f59e0b' : '#10b981');

        let fiveHourPct = 100;
        let fiveHourReset = '';
        let weeklyPct = 100;
        let weeklyReset = '';

        if (quotaData && (quotaData.groups || quotaData.quotaGroups)) {
          const groups = quotaData.groups || quotaData.quotaGroups || [];
          const geminiGroup = groups.find(g => (g.displayName || '').includes('Gemini')) || groups[0];
          if (geminiGroup && geminiGroup.buckets) {
            const hBucket = geminiGroup.buckets.find(b => (b.window === '5h' || (b.bucketId || '').includes('5h')));
            const wBucket = geminiGroup.buckets.find(b => (b.window === 'weekly' || (b.bucketId || '').includes('weekly')));

            if (hBucket?.remaining?.value != null) {
              fiveHourPct = Math.round(hBucket.remaining.value * 100);
              fiveHourReset = formatResetTime(hBucket.resetTime?.seconds);
            }
            if (wBucket?.remaining?.value != null) {
              weeklyPct = Math.round(wBucket.remaining.value * 100);
              weeklyReset = formatResetTime(wBucket.resetTime?.seconds);
            }
          }
        }

        const tipCtx = \`\${labels.ctx}: \${ctxPct.toFixed(1)}% (\${ctxK} / \${maxK} токенов)\`;
        const tip5h = \`\${labels.tip5h}: \${fiveHourPct}%\${fiveHourReset ? \` (\${labels.reset} \${fiveHourReset})\` : ''}\`;
        const tipWk = \`\${labels.tipWk}: \${weeklyPct}%\${weeklyReset ? \` (\${labels.reset} \${weeklyReset})\` : ''}\`;
        container.title = \`\${tipCtx}\\n\${tip5h}\\n\${tipWk}\\n(Нажмите для мгновенного обновления)\`;

        const fiveHourColor = fiveHourPct > 35 ? '#10b981' : (fiveHourPct > 15 ? '#f59e0b' : '#ef4444');
        const weeklyColor = weeklyPct > 35 ? '#3b82f6' : (weeklyPct > 15 ? '#f59e0b' : '#ef4444');

        container.innerHTML = \`
          <!-- 1. Model & Context Length -->
          <div style="margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-weight: 600; color: #f1f5f9; font-size: 10.5px;">\${modelName}</span>
              <span style="font-size: 9.5px; color: \${ctxColor}; font-weight: 600;">\${ctxPct.toFixed(1)}% <span style="font-weight: 400; color: #94a3b8;">(\${ctxK}/\${maxK})</span></span>
            </div>
            <div style="background: rgba(255,255,255,0.08); height: 4px; border-radius: 2px; overflow: hidden;">
              <div style="background: \${ctxColor}; width: \${ctxBarWidth}%; height: 100%; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <!-- 2. 5-Hour Limit Remaining -->
          <div style="margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-weight: 500; color: #94a3b8; font-size: 10px;">\${labels.h5}</span>
              <span style="font-size: 9.5px; color: \${fiveHourColor}; font-weight: 600;">\${fiveHourPct}% \${fiveHourReset ? \`<span style="font-weight: 400; color: #64748b;">(\${fiveHourReset})</span>\` : ''}</span>
            </div>
            <div style="background: rgba(255,255,255,0.08); height: 4px; border-radius: 2px; overflow: hidden;">
              <div style="background: \${fiveHourColor}; width: \${Math.min(100, Math.max(0, fiveHourPct))}%; height: 100%; transition: width 0.3s ease;"></div>
            </div>
          </div>

          <!-- 3. Weekly Limit Remaining -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <span style="font-weight: 500; color: #94a3b8; font-size: 10px;">\${labels.weekly}</span>
              <span style="font-size: 9.5px; color: \${weeklyColor}; font-weight: 600;">\${weeklyPct}% \${weeklyReset ? \`<span style="font-weight: 400; color: #64748b;">(\${weeklyReset})</span>\` : ''}</span>
            </div>
            <div style="background: rgba(255,255,255,0.08); height: 4px; border-radius: 2px; overflow: hidden;">
              <div style="background: \${weeklyColor}; width: \${Math.min(100, Math.max(0, weeklyPct))}%; height: 100%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        \`;
      } catch (hudErr) {
        console.warn('[Tokens-HUD] Render error:', hudErr);
      }
    };

    // Alt + L Shortcut
    window.addEventListener('keydown', function(e) {
      if (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д')) {
        e.preventDefault();
        const langs = ['ru', 'en', 'de', 'es', 'fr', 'tr', 'uk', 'kk', 'be', 'uz'];
        const nextIdx = (langs.indexOf(currentLang) + 1) % langs.length;
        setLanguage(langs[nextIdx]);
      }
      if (e.key === 'Escape') {
        const menu = document.getElementById('agent-ui-lang-menu');
        if (menu) menu.remove();
      }
    });

    function setup() {
      try {
        refreshTokenStats(true);
        const root = document.documentElement || document.body || document;
        if (root) {
          observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['placeholder', 'title', 'aria-label']
          });
        }
        if (document.body) {
          walkAndTranslate(document.body);
          injectLanguageSwitcher();
          if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
            window.__AGY_RENDER_TOKENS_HUD__();
          }
        }
      } catch (e) {
        console.error('[Agent-UI-Localizer] Setup error:', e);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }

    window.addEventListener('load', function() {
      if (document.body) {
        walkAndTranslate(document.body);
        injectLanguageSwitcher();
        refreshTokenStats(true);
        if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
          window.__AGY_RENDER_TOKENS_HUD__();
        }
      }
    });

    setInterval(function() {
      injectLanguageSwitcher();
      refreshTokenStats(false);
      if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
        window.__AGY_RENDER_TOKENS_HUD__();
      }
    }, 2000);

    let lastKnownConvId = null;
    setInterval(function() {
      const cid = getActiveConvId();
      if (cid && cid !== lastKnownConvId) {
        lastKnownConvId = cid;
        refreshTokenStats(true);
      }
    }, 1000);

    if (window.__TSR_ROUTER__ && typeof window.__TSR_ROUTER__.subscribe === 'function') {
      try {
        window.__TSR_ROUTER__.subscribe(() => {
          refreshTokenStats(true);
          if (typeof window.__AGY_RENDER_TOKENS_HUD__ === 'function') {
            window.__AGY_RENDER_TOKENS_HUD__();
          }
        });
      } catch (_) {}
    }

    console.log('[Agent-UI-Localizer] Multi-language engine & Native Tokens HUD initialized successfully.');
  } catch (globalErr) {
    console.error('[Agent-UI-Localizer] Fatal initialization error:', globalErr);
  }
})();
`;

fs.writeFileSync('engine/ui-localizer.js', engineTemplate, 'utf8');
console.log('Successfully generated engine/ui-localizer.js with 10 languages + Native Tokens HUD!');

const fs = require('fs');

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
  for (const [enKey, transVal] of Object.entries(locale.exact)) {
    if (transVal && typeof transVal === 'string') {
      const trimmed = transVal.trim();
      REVERSE_MAP[trimmed] = enKey;
      REVERSE_MAP[trimmed.toLowerCase()] = enKey;
    }
  }
}

const engineTemplate = `/**
 * Agent UI Localizer - Universal Multi-Language Translation Engine & Country Picker
 * Supports: Русский (ru), Українська (uk), Қазақша (kk), Беларуская (be), O'zbekcha (uz), English (en)
 */
(function() {
  try {
    if (window.__AGENT_UI_LOCALIZER_INITIALIZED__) return;
    window.__AGENT_UI_LOCALIZER_INITIALIZED__ = true;

    console.log('[Agent-UI-Localizer] Starting multi-language translation engine...');

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
      uz: 'O\'zbekcha'
    };

    const TOAST_MSGS = {
      ru: '🇷🇺 Язык интерфейса: Русский',
      en: '🇬🇧 Interface language: English',
      de: '🇩🇪 Oberflächensprache: Deutsch',
      es: '🇪🇸 Idioma de la interfaz: Español',
      fr: '🇫🇷 Langue de l\'interface: Français',
      tr: '🇹🇷 Arayüz dili: Türkçe',
      uk: '🇺🇦 Мова інтерфейсу: Українська',
      kk: '🇰🇿 Интерфейс тілі: Қазақша',
      be: '🇧🇾 Мова інтэрфейсу: Беларуская',
      uz: '🇺🇿 Interfeys tili: O\'zbekcha'
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

    // High quality SVG flags for all supported CIS countries & English
    const FLAG_SVGS = {
      ru: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#ffffff" width="9" height="2"/><rect fill="#0039a6" y="2" width="9" height="2"/><rect fill="#d52b1e" y="4" width="9" height="2"/></svg>',
      uk: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#0057b7" width="9" height="3"/><rect fill="#ffd700" y="3" width="9" height="3"/></svg>',
      kk: '<svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect width="20" height="14" fill="#00afca"/><rect x="0" y="0" width="2" height="14" fill="#fec50c"/><circle cx="11" cy="6" r="2.5" fill="#fec50c"/><path d="M7.5 9.5 Q11 8 14.5 9.5 Q11 9 7.5 9.5 Z" fill="#fec50c"/></svg>',
      be: '<svg width="20" height="14" viewBox="0 0 9 6" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#c8313e" width="9" height="4"/><rect fill="#4aa658" y="4" width="9" height="2"/><rect fill="#ffffff" width="1.5" height="6"/></svg>',
      uz: '<svg width="20" height="14" viewBox="0 0 20 14" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><rect fill="#0099b5" width="20" height="4.4"/><rect fill="#ce1126" y="4.4" width="20" height="0.6"/><rect fill="#ffffff" y="5.0" width="20" height="4.0"/><rect fill="#ce1126" y="9.0" width="20" height="0.6"/><rect fill="#1eb53a" y="9.6" width="20" height="4.4"/><circle cx="3" cy="2.2" r="1.3" fill="#ffffff"/><circle cx="3.5" cy="2.2" r="1.1" fill="#0099b5"/></svg>',
      en: '<svg width="20" height="14" viewBox="0 0 60 30" style="border-radius:2px;box-shadow:0 0 1px rgba(0,0,0,0.6);display:block;pointer-events:none;"><clipPath id="uk-f-c"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="uk-f-d"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#uk-f-c)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-f-d)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>'
    };

    // Node persistent disk storage in user profile
    let nodeFs = null;
    let nodePath = null;
    let langFilePath = null;
    try {
      if (typeof require === 'function') {
        nodeFs = require('fs');
        nodePath = require('path');
        const os = require('os');
        const home = os.homedir() || process.env.USERPROFILE || process.env.HOME || '';
        const dir = nodePath.join(home, '.gemini');
        if (!nodeFs.existsSync(dir)) {
          nodeFs.mkdirSync(dir, { recursive: true });
        }
        langFilePath = nodePath.join(dir, 'agent_ui_lang.txt');

        // Dynamically load custom user-generated AI locales from ~/.gemini/custom_locales/
        const customLocalesDir = nodePath.join(dir, 'custom_locales');
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
                }
              } catch (e) {
                console.warn('[Agent-UI-Localizer] Failed loading custom locale:', f, e);
              }
            }
          }
        }
      }
    } catch (_) {}

    function getSavedLang() {
      try {
        if (nodeFs && langFilePath && nodeFs.existsSync(langFilePath)) {
          const content = nodeFs.readFileSync(langFilePath, 'utf8').trim();
          if (content && (['ru', 'uk', 'kk', 'be', 'uz', 'en'].includes(content) || LOCALES[content])) {
            return content;
          }
        }
      } catch (_) {}
      try {
        const stored = window.localStorage && window.localStorage.getItem('agent_ui_lang');
        if (stored && (['ru', 'uk', 'kk', 'be', 'uz', 'en'].includes(stored) || LOCALES[stored])) {
          return stored;
        }
      } catch (_) {}
      return 'ru';
    }

    function saveLang(lang) {
      try {
        if (nodeFs && langFilePath) {
          nodeFs.writeFileSync(langFilePath, lang, 'utf8');
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

    // Resolves any text (whether English, Russian, Ukrainian, Kazakh, etc.) back to canonical English
    function resolveCanonicalEnglish(text) {
      if (!text || typeof text !== 'string') return null;
      const trimmed = text.trim();
      if (!trimmed) return null;

      // 1. Is it already in exact English keys?
      if (LOCALES.ru.exact[trimmed]) return trimmed;

      // 2. Trailing colon?
      if (trimmed.endsWith(':')) {
        const withoutColon = trimmed.slice(0, -1).trim();
        if (LOCALES.ru.exact[withoutColon]) return trimmed;
        if (REVERSE_MAP[withoutColon]) return REVERSE_MAP[withoutColon] + ':';
      }

      // 3. In REVERSE_MAP?
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
      if (locale.exact[trimmed]) {
        return leadingSpace + locale.exact[trimmed] + trailingSpace;
      }

      // 2. Trailing colon handling (e.g. "Preset:" or "Plan:")
      if (trimmed.endsWith(':')) {
        const withoutColon = trimmed.slice(0, -1).trim();
        if (locale.exact[withoutColon]) {
          return leadingSpace + locale.exact[withoutColon] + ':' + trailingSpace;
        }
        if (lowerMap[withoutColon.toLowerCase()]) {
          return leadingSpace + lowerMap[withoutColon.toLowerCase()] + ':' + trailingSpace;
        }
      }

      // 3. Case-insensitive match in target locale
      const lower = trimmed.toLowerCase();
      if (lowerMap[lower]) {
        return leadingSpace + lowerMap[lower] + trailingSpace;
      }

      // 4. Pattern regex match
      if (locale.patterns) {
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

      // 5. Fallback to Russian if missing in other CIS language
      if (lang !== 'ru' && LOCALES.ru) {
        if (LOCALES.ru.exact[trimmed]) {
          return leadingSpace + LOCALES.ru.exact[trimmed] + trailingSpace;
        }
        if (LOWER_MAPS.ru[lower]) {
          return leadingSpace + LOWER_MAPS.ru[lower] + trailingSpace;
        }
      }

      return null;
    }

    function translateElementAttrs(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.id === 'agent-ui-lang-switcher' || node.id === 'agent-ui-lang-menu' || node.id === 'agent-ui-toast' || node.closest?.('#agent-ui-lang-switcher') || node.closest?.('#agent-ui-lang-menu')) return;

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
        if (parent.id === 'agent-ui-lang-switcher' || parent.id === 'agent-ui-lang-menu' || parent.id === 'agent-ui-toast' || parent.closest?.('#agent-ui-lang-switcher') || parent.closest?.('#agent-ui-lang-menu')) return;
      }

      const val = node.nodeValue;
      if (!val || !val.trim()) return;

      // Retrieve or resolve canonical English text
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
        if (node.id === 'agent-ui-lang-switcher' || node.id === 'agent-ui-lang-menu' || node.id === 'agent-ui-toast' || node.closest?.('#agent-ui-lang-switcher') || node.closest?.('#agent-ui-lang-menu')) return;
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
      showToast(TOAST_MSGS[currentLang] || ('Язык: ' + (LANG_NAMES[currentLang] || currentLang)));
    }

    function updateSwitcherUI() {
      const btn = document.getElementById('agent-ui-lang-switcher');
      if (!btn) return;
      const flagSvg = FLAG_SVGS[currentLang] || FLAG_SVGS.ru;
      const caretSvg = '<svg width="8" height="6" viewBox="0 0 8 6" style="opacity:0.75;display:block;pointer-events:none;"><path d="M1 1.5L4 4.5L7 1.5" stroke="#ffffff" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>';
      btn.innerHTML = \`<span style="display:inline-flex;align-items:center;gap:4px;pointer-events:none;">\${flagSvg}\${caretSvg}</span>\`;
      btn.title = 'Язык / Мова / Тіл: ' + (LANG_NAMES[currentLang] || 'Русский') + ' (Нажмите для выбора страны)';
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
        { code: 'uz', name: 'Узбекский', native: 'O\'zbekcha' }
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
      // 1. Find forward navigation button in top header bar
      const fwd = document.querySelector('button[aria-label="Go Forward"], button[title="Go Forward"], button[aria-label="Вперед"], button[title="Вперед"], button[aria-label*="Forward"], button[aria-label*="Вперед"]');
      if (fwd && fwd.parentElement) return fwd.parentElement;

      // 2. Find by material symbol text
      const symbols = document.querySelectorAll('button span, button i');
      for (const s of symbols) {
        if (s.textContent?.trim() === 'arrow_forward' && s.closest('button')) {
          const b = s.closest('button');
          if (b.parentElement) return b.parentElement;
        }
      }

      // 3. Fallback to sidebar toggle container
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

          // Observe button content to immediately restore flag if emptied by React reconciliation
          const btnObserver = new MutationObserver(() => {
            if (!btn.hasChildNodes() || btn.innerHTML.trim() === '') {
              updateSwitcherUI();
            }
          });
          btnObserver.observe(btn, { childList: true });
        }

        // Always ensure content is up to date
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

        // Fixed position fallback in the top navigation bar area
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

    // Keyboard shortcut: Alt + L cycles to next language or opens menu
    window.addEventListener('keydown', function(e) {
      if (e.altKey && (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д')) {
        e.preventDefault();
        const langs = ['ru', 'uk', 'kk', 'be', 'uz', 'en'];
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
      }
    });

    setInterval(function() {
      injectLanguageSwitcher();
    }, 1200);

    console.log('[Agent-UI-Localizer] Multi-language engine initialized successfully.');
  } catch (globalErr) {
    console.error('[Agent-UI-Localizer] Fatal initialization error:', globalErr);
  }
})();
`;

fs.writeFileSync('engine/ui-localizer.js', engineTemplate, 'utf8');
console.log('Successfully generated engine/ui-localizer.js with bi-directional REVERSE_MAP and dynamic language switching!');

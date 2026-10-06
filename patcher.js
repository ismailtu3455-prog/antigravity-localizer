/**
 * Agent UI Localizer - Patcher & Installer
 * Patches Antigravity 2.0 and Claude Desktop app.asar with the multi-language UI localizer.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Default search paths on Windows
const DEFAULT_ANTIGRAVITY_DIR = path.join(
  process.env.LOCALAPPDATA || '',
  'Programs',
  'antigravity'
);

const DEFAULT_CLAUDE_DIR = [
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Claude'),
  path.join(process.env.LOCALAPPDATA || '', 'AnthropicClaude'),
  path.join(process.env.APPDATA || '', 'Claude')
].find(p => fs.existsSync(p));

function getAppPaths(appType = 'antigravity') {
  if (appType === 'antigravity') {
    const base = DEFAULT_ANTIGRAVITY_DIR;
    const resources = path.join(base, 'resources');
    const asar = path.join(resources, 'app.asar');
    const backup = path.join(resources, 'app.asar.bak');
    const patched = path.join(resources, 'app.asar.patched');
    return { name: 'Antigravity 2.0', base, resources, asar, backup, patched };
  } else if (appType === 'claude') {
    const base = DEFAULT_CLAUDE_DIR;
    if (!base) return null;
    const resources = path.join(base, 'resources');
    const asar = path.join(resources, 'app.asar');
    const backup = path.join(resources, 'app.asar.bak');
    const patched = path.join(resources, 'app.asar.patched');
    return { name: 'Claude Desktop', base, resources, asar, backup, patched };
  }
  return null;
}

function checkStatus(appType = 'antigravity') {
  const paths = getAppPaths(appType);
  console.log(`\n======================================================`);
  console.log(`  Проверка статуса: ${paths ? paths.name : appType}`);
  console.log(`======================================================`);

  if (!paths || !fs.existsSync(paths.base)) {
    console.log(`[!] Приложение ${appType} не найдено по стандартному пути.`);
    return false;
  }

  console.log(`[*] Каталог: ${paths.base}`);
  console.log(`[*] app.asar: ${fs.existsSync(paths.asar) ? 'найден' : 'отсутствует'}`);
  console.log(`[*] Резервная копия (app.asar.bak): ${fs.existsSync(paths.backup) ? 'создана' : 'отсутствует'}`);

  if (fs.existsSync(paths.patched)) {
    console.log(`[*] Готовый патч (app.asar.patched): готов к установке`);
  }

  return true;
}

function preparePatch(appType = 'antigravity') {
  const paths = getAppPaths(appType);
  if (!paths || !fs.existsSync(paths.asar)) {
    console.error(`[ОШИБКА] Не найден app.asar для ${appType}`);
    return false;
  }

  console.log(`\n[*] Подготовка патча локализации для ${paths.name}...`);

  // 1. Create backup if missing
  if (!fs.existsSync(paths.backup)) {
    console.log(`[*] Создание резервной копии: ${paths.backup}`);
    fs.copyFileSync(paths.asar, paths.backup);
  } else {
    console.log(`[*] Резервная копия: ${paths.backup}`);
  }

  // 2. Temp extraction directory
  const tempExtractDir = path.join(os.tmpdir(), `agent-localizer-${appType}-${Date.now()}`);
  fs.mkdirSync(tempExtractDir, { recursive: true });

  try {
    console.log(`[*] Распаковка архива во временный каталог...`);
    execSync(`npx asar extract "${paths.asar}" "${tempExtractDir}"`, { stdio: 'pipe' });

    // 3. Locate preload.js
    let preloadPath = path.join(tempExtractDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      preloadPath = path.join(tempExtractDir, 'preload.js');
    }

    if (!fs.existsSync(preloadPath)) {
      console.error(`[ОШИБКА] Файл preload.js не найден внутри app.asar`);
      return false;
    }

    console.log(`[*] Найден preload скрипт: ${preloadPath}`);

    // Read localizer engine code
    const engineCode = fs.readFileSync(path.join(__dirname, 'engine', 'ui-localizer.js'), 'utf8');

    // Read clean original preload from backup (avoid duplicate or broken previous injections)
    let cleanOriginalPreload = fs.readFileSync(preloadPath, 'utf8');
    if (fs.existsSync(paths.backup)) {
      try {
        const asarMod = require('@electron/asar');
        const raw = asarMod.extractFile(paths.backup, 'dist/preload.js');
        cleanOriginalPreload = raw.toString('utf8');
        console.log(`[*] Извлечен оригинальный preload из бэкапа (${cleanOriginalPreload.length} байт)`);
      } catch (e) {
        console.log(`[!] Не удалось извлечь preload из бэкапа, очистка от старых маркеров...`);
        cleanOriginalPreload = cleanOriginalPreload.replace(/\/\/ --- \[AGENT-UI-LOCALIZER INJECTION START\][\s\S]*?\/\/ --- \[AGENT-UI-LOCALIZER INJECTION END\] ---/g, '').trim();
      }
    }

    console.log(`[*] Внедрение движка локализации в конец чистого preload.js...`);
    const injectedPreload = `${cleanOriginalPreload}\n\n// --- [AGENT-UI-LOCALIZER INJECTION START] ---\n${engineCode}\n// --- [AGENT-UI-LOCALIZER INJECTION END] ---\n`;
    fs.writeFileSync(preloadPath, injectedPreload, 'utf8');

    // 3.5. Patch dist/updater.js to prevent auto-updater from replacing app.asar on app quit
    const updaterPath = path.join(tempExtractDir, 'dist', 'updater.js');
    if (fs.existsSync(updaterPath)) {
      let updaterCode = fs.readFileSync(updaterPath, 'utf8');
      updaterCode = updaterCode.replace(
        /electron_updater_1\.autoUpdater\.autoDownload\s*=\s*true/g,
        'electron_updater_1.autoUpdater.autoDownload = false'
      );
      updaterCode = updaterCode.replace(
        /electron_updater_1\.autoUpdater\.autoInstallOnAppQuit\s*=\s*[^;]+/g,
        'electron_updater_1.autoUpdater.autoInstallOnAppQuit = false'
      );
      fs.writeFileSync(updaterPath, updaterCode, 'utf8');
      console.log(`[*] Защита от автоперезаписи: dist/updater.js пропатчен (autoInstallOnAppQuit = false, autoDownload = false)`);
    }

    // 3.6. Patch dist/wsl.js to suppress wsl.exe interrogation on startup (completely removes 60s console window)
    const wslPath = path.join(tempExtractDir, 'dist', 'wsl.js');
    if (fs.existsSync(wslPath)) {
      let wslCode = fs.readFileSync(wslPath, 'utf8');
      wslCode = wslCode.replace(
        /async function listWslDistros\(\)\s*\{[\s\S]*?\}/,
        'async function listWslDistros() { return []; }'
      );
      wslCode = wslCode.replace(
        /async function execWsl\(args\)\s*\{[\s\S]*?\n\}/,
        'async function execWsl(args) { return ""; }'
      );
      fs.writeFileSync(wslPath, wslCode, 'utf8');
      console.log(`[*] Блокировка WSL: dist/wsl.js пропатчен (вызовы wsl.exe отключены, консольное окно удалено)`);
    }

    // 3.65. Patch dist/ipcHandlers.js to add native antigravity:get-token-stats IPC handler
    const ipcHandlersPath = path.join(tempExtractDir, 'dist', 'ipcHandlers.js');
    if (fs.existsSync(ipcHandlersPath)) {
      let ipcCode = fs.readFileSync(ipcHandlersPath, 'utf8');
      if (!ipcCode.includes('antigravity:get-token-stats')) {
        const handlerInjection = `
    // Native Tokens & Context Stats handler (Antigravity Hub & Localizer)
    electron_1.ipcMain.handle('antigravity:get-token-stats', async (_event, targetId) => {
      try {
        return __agyGetTokenStats(targetId);
      } catch (err) {
        return null;
      }
    });
`;
        ipcCode = ipcCode.replace(
          /(electron_1\.ipcMain\.handle\('wsl:connect'[\s\S]*?\}\);)/,
          `$1\n${handlerInjection}`
        );

        const helperFunctions = `
// --- [ANTIGRAVITY-HUB TOKEN STATS HELPER FUNCTIONS] ---
function __agyDecodeVarint(buf, offset) {
  let res = 0;
  let shift = 0;
  while (true) {
    if (offset >= buf.length) break;
    const b = buf[offset++];
    res += (b & 0x7f) * Math.pow(2, shift);
    if (!(b & 0x80)) break;
    shift += 7;
  }
  return [res, offset];
}

function __agyParseProto(buf, offset, end) {
  if (offset === undefined) offset = 0;
  if (end === undefined || end === null) end = buf.length;
  const fields = [];
  while (offset < end) {
    const [tag, nextOff] = __agyDecodeVarint(buf, offset);
    offset = nextOff;
    const fieldNum = Math.floor(tag / 8);
    const wireType = tag & 7;
    if (wireType === 0) {
      const [val, o] = __agyDecodeVarint(buf, offset);
      offset = o;
      fields.push({ fieldNum, wireType: 'varint', val });
    } else if (wireType === 2) {
      const [len, o] = __agyDecodeVarint(buf, offset);
      offset = o;
      const val = buf.subarray(offset, offset + len);
      offset += len;
      fields.push({ fieldNum, wireType: 'bytes', val });
    } else if (wireType === 1) {
      const val = buf.subarray(offset, offset + 8);
      offset += 8;
      fields.push({ fieldNum, wireType: 'fixed64', val });
    } else if (wireType === 5) {
      const val = buf.subarray(offset, offset + 4);
      offset += 4;
      fields.push({ fieldNum, wireType: 'fixed32', val });
    } else {
      break;
    }
  }
  return fields;
}

function __agyGetTokenStats(targetId) {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const dir = path.join(os.homedir(), '.gemini', 'antigravity', 'conversations');
    if (!fs.existsSync(dir)) return null;

    let targetPath = null;
    if (targetId) {
      const p = path.join(dir, targetId + '.db');
      if (fs.existsSync(p)) targetPath = p;
    }

    if (!targetPath) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.db')).map(f => {
        const p = path.join(dir, f);
        return { path: p, mtime: fs.statSync(p).mtimeMs, id: f.replace('.db', '') };
      }).sort((a, b) => b.mtime - a.mtime);
      if (files.length === 0) return null;
      targetPath = files[0].path;
      targetId = files[0].id;
    }

    const db = new DatabaseSync(targetPath, { readOnly: true });
    const rows = db.prepare('SELECT idx, data FROM gen_metadata ORDER BY idx ASC').all();
    let rec = null;
    for (const row of rows) {
      const proto = __agyParseProto(row.data);
      for (const f of proto) {
        if (f.fieldNum === 1) {
          for (const sf of __agyParseProto(f.val)) {
            if (sf.fieldNum === 17) {
              for (const tf of __agyParseProto(sf.val)) {
                if (tf.wireType === 'bytes') {
                  const sub = __agyParseProto(tf.val);
                  const map = {};
                  for (const item of sub) {
                    if (item.wireType === 'varint') map[item.fieldNum] = item.val;
                  }
                  if (map[2] || map[5] || map[3]) {
                    rec = {
                      session_id: targetId,
                      prompt_tokens: map[2] || 0,
                      output_tokens: map[3] || 0,
                      cached_tokens: map[5] || 0,
                      thinking_tokens: map[9] || 0,
                      text_tokens: map[10] || 0,
                      context_size: (map[5] || 0) + (map[2] || 0)
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
    db.close();
    return rec;
  } catch (err) {
    return null;
  }
}
`;
        ipcCode += '\n' + helperFunctions;
        fs.writeFileSync(ipcHandlersPath, ipcCode, 'utf8');
        console.log(`[*] Native Tokens HUD: dist/ipcHandlers.js пропатчен (IPC antigravity:get-token-stats зарегистрирован)`);
      }
    }

    // 3.7. Copy token_stats.py into app.asar and resources directory
    const tokenStatsSrc = path.join(__dirname, 'token_stats.py');
    if (fs.existsSync(tokenStatsSrc)) {
      try {
        fs.copyFileSync(tokenStatsSrc, path.join(tempExtractDir, 'token_stats.py'));
        fs.copyFileSync(tokenStatsSrc, path.join(paths.resources, 'token_stats.py'));
        console.log(`[*] Интеграция Tokens HUD: token_stats.py скопирован в app.asar и resources/`);
      } catch (tsErr) {
        console.warn(`[!] Предупреждение при копировании token_stats.py:`, tsErr.message);
      }
    }

    // 4. Repack to app.asar.patched
    console.log(`[*] Сборка пропатченного архива в: ${paths.patched}`);
    execSync(`npx asar pack "${tempExtractDir}" "${paths.patched}"`, { stdio: 'pipe' });

    console.log(`\n[УСПЕХ] Пропатченный файл успешно собран: ${paths.patched}`);
    console.log(`[ИНФО] Для применения патча выполните скрипт apply-patch.bat (или 'npm run patch:${appType}')`);

    return true;
  } catch (err) {
    console.error(`[ОШИБКА] Не удалось собрать патч:`, err.message);
    return false;
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

function restoreOriginal(appType = 'antigravity') {
  const paths = getAppPaths(appType);
  if (!paths) return;

  if (!fs.existsSync(paths.backup)) {
    console.error(`[ОШИБКА] Резервная копия ${paths.backup} не найдена!`);
    return;
  }

  console.log(`[*] Восстановление оригинального app.asar из резервной копии...`);
  // Note: if file is locked, provide instructions
  try {
    fs.copyFileSync(paths.backup, paths.asar);
    console.log(`[УСПЕХ] Оригинальный app.asar успешно восстановлен!`);
  } catch (err) {
    console.log(`[!] Файл сейчас заблокирован запущенным приложением.`);
    console.log(`[!] Запустите uninstall.bat при закрытом приложении для мгновенного отката.`);
  }
}

// CLI Argument parser
const args = process.argv.slice(2);
const appTarget = args.includes('--app') ? args[args.indexOf('--app') + 1] : 'antigravity';

if (args.includes('--status')) {
  checkStatus(appTarget);
} else if (args.includes('--install') || args.includes('--patch')) {
  preparePatch(appTarget);
} else if (args.includes('--restore') || args.includes('--unpatch')) {
  restoreOriginal(appTarget);
} else {
  console.log(`Использование:`);
  console.log(`  node patcher.js --app antigravity --install   (Подготовить патч для Antigravity)`);
  console.log(`  node patcher.js --app antigravity --restore   (Восстановить оригинал)`);
  console.log(`  node patcher.js --app antigravity --status    (Проверить статус)`);
  console.log(`  node patcher.js --app claude --install        (Подготовить патч для Claude Desktop)`);
}

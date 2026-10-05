const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const targetDir = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources');
const asar = path.join(targetDir, 'app.asar');
const asarBak = path.join(targetDir, 'app.asar.bak');
const asarPatched = path.join(targetDir, 'app.asar.patched');
const exePath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'Antigravity.exe');

console.log('======================================================');
console.log('   Установка локализатора интерфейса Antigravity 2.0');
console.log('======================================================\n');

// 1. Build patch
console.log('[*] Шаг 1: Проверка и сборка пропатченного файла интерфейса...');
try {
  execSync(`node "${path.join(__dirname, 'patcher.js')}" --app antigravity --install`, { stdio: 'inherit' });
} catch (e) {
  console.error('[ОШИБКА] Не удалось собрать патч.');
  process.exit(1);
}

// 2. Check if Antigravity is running
function isProcessRunning() {
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe"', { encoding: 'utf8' });
    return out.toLowerCase().includes('antigravity.exe');
  } catch (_) {
    return false;
  }
}

if (isProcessRunning()) {
  console.log('\n[!] Внимание: Antigravity сейчас запущена.');
  console.log('[*] Для замены файлов интерфейса необходимо закрыть приложение.');
  console.log('[*] Закрытие Antigravity через 2 секунды...');
  try {
    execSync('taskkill /F /IM Antigravity.exe /T', { stdio: 'ignore' });
  } catch (_) {}
  
  // Wait a moment for process locks to release
  let attempts = 0;
  while (isProcessRunning() && attempts < 10) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    attempts++;
  }
}

// Clean updater cache to prevent pending updates from overwriting app.asar
try {
  const updaterDir = path.join(process.env.LOCALAPPDATA || '', 'antigravity-updater');
  const pendingDir = path.join(updaterDir, 'pending');
  const installerExe = path.join(updaterDir, 'installer.exe');
  if (fs.existsSync(installerExe)) {
    try { fs.unlinkSync(installerExe); } catch (_) {}
  }
  if (fs.existsSync(pendingDir)) {
    fs.readdirSync(pendingDir).forEach(f => {
      try { fs.unlinkSync(path.join(pendingDir, f)); } catch (_) {}
    });
  }
} catch (_) {}

// 3. Swap file
console.log('\n[*] Шаг 2: Применение пропатченного app.asar...');
if (!fs.existsSync(asarPatched)) {
  console.error(`[ОШИБКА] Файл ${asarPatched} не найден!`);
  process.exit(1);
}

if (!fs.existsSync(asarBak)) {
  console.log(`[*] Создание резервной копии: ${asarBak}`);
  fs.copyFileSync(asar, asarBak);
}

try {
  fs.copyFileSync(asarPatched, asar);
  console.log('[УСПЕХ] Файл интерфейса успешно обновлен!');
} catch (err) {
  console.error('[ОШИБКА] Не удалось скопировать файл:', err.message);
  console.log('[!] Убедитесь, что Antigravity полностью закрыта, и повторите запуск.');
  process.exit(1);
}

// 4. Relaunch Antigravity
console.log('\n[*] Шаг 3: Перезапуск Antigravity с новым интерфейсом...');
try {
  spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref();
} catch (err) {
  console.log('[!] Не удалось автоматически запустить Antigravity. Запустите её вручную из меню Пуск.');
}

console.log('\n======================================================');
console.log(' Готово! Интерфейс Antigravity переведен.');
console.log(' В верхней панели навигации (справа от стрелок) доступна аккуратная кнопка с флагом.');
console.log(' Быстрое переключение языка: клик по флагу или горячая клавиша Alt + L');
console.log('======================================================\n');

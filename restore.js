const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const targetDir = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources');
const asar = path.join(targetDir, 'app.asar');
const asarBak = path.join(targetDir, 'app.asar.bak');
const exePath = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'Antigravity.exe');

console.log('======================================================');
console.log('    Откат к оригинальному интерфейсу Antigravity 2.0');
console.log('======================================================\n');

if (!fs.existsSync(asarBak)) {
  console.error(`[ОШИБКА] Резервная копия ${asarBak} не найдена!`);
  process.exit(1);
}

function isProcessRunning() {
  try {
    const out = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe"', { encoding: 'utf8' });
    return out.toLowerCase().includes('antigravity.exe');
  } catch (_) {
    return false;
  }
}

if (isProcessRunning()) {
  console.log('[*] Закрытие Antigravity...');
  try {
    execSync('taskkill /F /IM Antigravity.exe /T', { stdio: 'ignore' });
  } catch (_) {}
  
  let attempts = 0;
  while (isProcessRunning() && attempts < 10) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    attempts++;
  }
}

console.log('[*] Восстановление оригинального файла из резервной копии...');
try {
  fs.copyFileSync(asarBak, asar);
  console.log('[УСПЕХ] Оригинальный app.asar успешно восстановлен!');
} catch (err) {
  console.error('[ОШИБКА] Не удалось восстановить файл:', err.message);
  process.exit(1);
}

console.log('[*] Запуск Antigravity с оригинальным интерфейсом...');
try {
  spawn(exePath, [], { detached: true, stdio: 'ignore' }).unref();
} catch (_) {}

console.log('\nОригинальный интерфейс полностью восстановлен.');

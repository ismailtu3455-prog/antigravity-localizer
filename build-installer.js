const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==========================================================');
console.log('  Building Standalone EXE Installer: AntigravityLocalizerSetup.exe');
console.log('==========================================================\n');

const baseDir = __dirname;
const hubDir = path.resolve(baseDir, '..', 'antigravity-hub');
const patchedAsar = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources', 'app.asar.patched');

// Always regenerate fresh engine and fresh app.asar.patched
console.log('[*] 1. Generating latest engine/ui-localizer.js (10 languages + Native Tokens HUD)...');
execSync(`node "${path.join(baseDir, 'generate-engine.js')}"`, { stdio: 'inherit' });

console.log('[*] 2. Packing fresh app.asar.patched (with WSL popup suppression + anti-updater + localizer + HUD)...');
execSync(`node "${path.join(baseDir, 'patcher.js')}" --app antigravity --install`, { stdio: 'inherit' });

// 3. Compress app.asar.patched to zip
const zipPath = path.join(baseDir, 'app.asar.patched.zip');
console.log(`[*] 3. Compressing patch archive to ${zipPath}...`);
execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${patchedAsar}' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });

// 4. Locate csc.exe
let cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (!fs.existsSync(cscPath)) {
  cscPath = 'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe';
}

const sourceFile = path.join(baseDir, 'installer_src', 'Program.cs');
const outputExe = path.join(baseDir, 'AntigravityLocalizerSetup.exe');

console.log(`[*] 4. Compiling standalone EXE with embedded payload...`);
const cmd = `"${cscPath}" /target:exe /optimize+ /platform:anycpu /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /resource:"${zipPath}",Payload /out:"${outputExe}" "${sourceFile}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(outputExe)) {
    const stats = fs.statSync(outputExe);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n[SUCCESS] Standalone EXE created: ${outputExe} (${sizeMb} MB)`);

    // Copy to antigravity-hub folder so Hub always has the latest installer
    if (fs.existsSync(hubDir)) {
      const targetInHub = path.join(hubDir, 'AntigravityLocalizerSetup.exe');
      fs.copyFileSync(outputExe, targetInHub);
      console.log(`[*] Copied latest setup to: ${targetInHub}`);
    }
  }
} catch (e) {
  console.error('[ERROR] Compilation failed:', e.message);
}

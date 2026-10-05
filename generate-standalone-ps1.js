const fs = require('fs');
const path = require('path');

const zipPath = path.join(__dirname, 'app.asar.patched.zip');
const zipBuf = fs.readFileSync(zipPath);
const b64 = zipBuf.toString('base64');

const psTemplate = `<#
.SYNOPSIS
    Автономный PowerShell инсталлятор Antigravity Localizer в 1 команду
    Запуск:
    irm https://.../install-standalone.ps1 | iex
#>
param([switch]$Restore, [switch]$Silent)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   Установка локализатора интерфейса Antigravity 2.0" -ForegroundColor Cyan
Write-Host "   Поддержка: 🇷🇺 RU | 🇺🇦 UK | 🇰🇿 KK | 🇧🇾 BE | 🇺🇿 UZ | 🇬🇧 EN" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

$appDir = Join-Path $env:LOCALAPPDATA "Programs\\antigravity"
$resourcesDir = Join-Path $appDir "resources"
$asarPath = Join-Path $resourcesDir "app.asar"
$backupPath = Join-Path $resourcesDir "app.asar.bak"
$exePath = Join-Path $appDir "Antigravity.exe"

if (-not (Test-Path $resourcesDir)) {
    Write-Host "[ОШИБКА] Antigravity не найдена в: $appDir" -ForegroundColor Red
    return
}

Write-Host "[*] Найдена установка Antigravity: $appDir" -ForegroundColor Green

if ($Restore) {
    if (-not (Test-Path $backupPath)) {
        Write-Host "[ОШИБКА] Резервная копия не найдена: $backupPath" -ForegroundColor Red
        return
    }
    Get-Process -Name Antigravity -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Copy-Item $backupPath $asarPath -Force
    Write-Host "[УСПЕХ] Оригинальный интерфейс Antigravity успешно восстановлен!" -ForegroundColor Green
    return
}

# Закрытие запущенных процессов
$runningProcs = Get-Process -Name Antigravity -ErrorAction SilentlyContinue
if ($runningProcs) {
    Write-Host "[*] Закрытие запущенных процессов Antigravity..." -ForegroundColor Yellow
    $runningProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Очистка кеша автообновлений
try {
    $updaterDir = Join-Path $env:LOCALAPPDATA "antigravity-updater"
    $pendingDir = Join-Path $updaterDir "pending"
    $installerExe = Join-Path $updaterDir "installer.exe"
    if (Test-Path $installerExe) { Remove-Item $installerExe -Force -ErrorAction SilentlyContinue }
    if (Test-Path $pendingDir) { Remove-Item (Join-Path $pendingDir "*") -Recurse -Force -ErrorAction SilentlyContinue }
    Write-Host "[*] Кеш автообновлений очищен (защита от сброса при перезапуске)." -ForegroundColor Green
} catch {}

# Бэкап оригинала
if (-not (Test-Path $backupPath) -and (Test-Path $asarPath)) {
    Write-Host "[*] Создание резервной копии оригинального интерфейса (app.asar.bak)..." -ForegroundColor Yellow
    Copy-Item $asarPath $backupPath -Force
}

# Распаковка встроенного пакета Base64
Write-Host "[*] Развертывание встроенного пакета локализации..." -ForegroundColor Yellow
$tempZip = Join-Path $env:TEMP "ag_embed_$(Get-Random).zip"
$tempDir = Join-Path $env:TEMP "ag_embed_$(Get-Random)"

try {
    $b64Data = @"
${b64}
"@
    $zipBytes = [System.Convert]::FromBase64String($b64Data)
    [System.IO.File]::WriteAllBytes($tempZip, $zipBytes)
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force

    $extractedAsar = Get-ChildItem -Path $tempDir -Filter "*app.asar*" | Select-Object -First 1
    if ($extractedAsar) {
        Copy-Item $extractedAsar.FullName $asarPath -Force
        Write-Host "[*] Локализатор успешно установлен в app.asar!" -ForegroundColor Green
    } else {
        throw "Не удалось извлечь app.asar из встроенного архива."
    }
} finally {
    if (Test-Path $tempZip) { Remove-Item $tempZip -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}

# Запуск приложения
if (Test-Path $exePath) {
    Write-Host "[*] Запуск Antigravity с новым интерфейсом..." -ForegroundColor Green
    Start-Process -FilePath $exePath
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [УСПЕХ] Локализатор успешно установлен!" -ForegroundColor Green
Write-Host " В верхнем баре справа от стрелок доступен флаг с выбором языков:" -ForegroundColor Green
Write-Host "   🇷🇺 Русский | 🇺🇦 Українська | 🇰🇿 Қазақша | 🇧🇾 Беларуская | 🇺🇿 O'zbekcha" -ForegroundColor Green
Write-Host " Горячая клавиша для смены языка: Alt + L" -ForegroundColor Green
Write-Host " Для отката к оригиналу выполните: install-standalone.ps1 -Restore" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

if (-not $Silent) {
    Write-Host "Для выхода нажмите Enter..."
    Read-Host
}
`;

const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
fs.writeFileSync(path.join(__dirname, 'install-standalone.ps1'), Buffer.concat([bom, Buffer.from(psTemplate, 'utf8')]));
console.log('Created install-standalone.ps1 successfully!');

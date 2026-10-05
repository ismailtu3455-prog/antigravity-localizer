<#
.SYNOPSIS
    Универсальный установщик локализатора интерфейса Antigravity 2.0 (СНГ & Multi-Language)
    Установка в 1 команду:
    irm https://raw.githubusercontent.com/<USER>/<REPO>/main/install.ps1 | iex
    или локально:
    powershell -ExecutionPolicy Bypass -File .\install.ps1
#>

param(
    [switch]$Restore,
    [switch]$Silent,
    [string]$DownloadUrl = "https://github.com/isma-project/antigravity-localizer/releases/latest/download/app.asar.patched.zip"
)

$Host.UI.RawUI.WindowTitle = "Локализатор Antigravity 2.0"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "   Установка локализатора интерфейса Antigravity 2.0" -ForegroundColor Cyan
Write-Host "   Поддержка: 🇷🇺 RU | 🇺🇦 UK | 🇰🇿 KK | 🇧🇾 BE | 🇺🇿 UZ | 🇬🇧 EN" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Поиск установки Antigravity
$appDir = Join-Path $env:LOCALAPPDATA "Programs\antigravity"
$resourcesDir = Join-Path $appDir "resources"
$asarPath = Join-Path $resourcesDir "app.asar"
$backupPath = Join-Path $resourcesDir "app.asar.bak"
$exePath = Join-Path $appDir "Antigravity.exe"

if (-not (Test-Path $resourcesDir)) {
    Write-Host "[ОШИБКА] Antigravity не найдена по пути: $appDir" -ForegroundColor Red
    Write-Host "[ИНФО] Убедитесь, что Antigravity установлена в системе." -ForegroundColor Yellow
    return
}

Write-Host "[*] Найдена установка Antigravity: $appDir" -ForegroundColor Green

# Обработка команды отката (-Restore)
if ($Restore) {
    if (-not (Test-Path $backupPath)) {
        Write-Host "[ОШИБКА] Резервная копия не найдена: $backupPath" -ForegroundColor Red
        return
    }

    Write-Host "[*] Закрытие Antigravity перед восстановлением..." -ForegroundColor Yellow
    Get-Process -Name Antigravity -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    Copy-Item $backupPath $asarPath -Force
    Write-Host "[УСПЕХ] Оригинальный интерфейс Antigravity успешно восстановлен!" -ForegroundColor Green
    return
}

# 2. Закрытие запущенных процессов Antigravity
$runningProcs = Get-Process -Name Antigravity -ErrorAction SilentlyContinue
if ($runningProcs) {
    Write-Host "[*] Закрытие запущенных процессов Antigravity..." -ForegroundColor Yellow
    $runningProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 3. Очистка кеша автообновлений (защита от перезаписи патча при перезапуске)
try {
    $updaterDir = Join-Path $env:LOCALAPPDATA "antigravity-updater"
    $pendingDir = Join-Path $updaterDir "pending"
    $installerExe = Join-Path $updaterDir "installer.exe"

    if (Test-Path $installerExe) {
        Remove-Item $installerExe -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $pendingDir) {
        Remove-Item (Join-Path $pendingDir "*") -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[*] Кеш автообновлений очищен (защита от сброса при перезапуске)." -ForegroundColor Green
} catch {
    # Игнорировать, если каталог недоступен
}

# 4. Резервная копия оригинального app.asar
if (-not (Test-Path $backupPath) -and (Test-Path $asarPath)) {
    Write-Host "[*] Создание резервной копии оригинального интерфейса (app.asar.bak)..." -ForegroundColor Yellow
    Copy-Item $asarPath $backupPath -Force
    Write-Host "[*] Резервная копия сохранена." -ForegroundColor Green
}

# 5. Поиск или загрузка пакета локализации
$applied = $false
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }

# Проверка локального файла app.asar.patched
$localPatched = Join-Path $scriptDir "app.asar.patched"
$localPatchedInResources = Join-Path $resourcesDir "app.asar.patched"
$localZip = Join-Path $scriptDir "app.asar.patched.zip"

if (Test-Path $localPatched) {
    Write-Host "[*] Применение локального пропатченного файла..." -ForegroundColor Yellow
    Copy-Item $localPatched $asarPath -Force
    $applied = $true
} elseif (Test-Path $localPatchedInResources) {
    Write-Host "[*] Применение готового пропатченного файла из resources..." -ForegroundColor Yellow
    Copy-Item $localPatchedInResources $asarPath -Force
    $applied = $true
} elseif (Test-Path $localZip) {
    Write-Host "[*] Распаковка локального архива пакета..." -ForegroundColor Yellow
    $tempDir = Join-Path $env:TEMP "antigravity-loc-$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    Expand-Archive -Path $localZip -DestinationPath $tempDir -Force
    $extractedAsar = Get-ChildItem -Path $tempDir -Filter "*app.asar*" | Select-Object -First 1
    if ($extractedAsar) {
        Copy-Item $extractedAsar.FullName $asarPath -Force
        $applied = $true
    }
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# Если локальных файлов нет (удаленный запуск через irm | iex), скачиваем с GitHub / сайта
if (-not $applied) {
    Write-Host "[*] Загрузка пакета локализации ($DownloadUrl)..." -ForegroundColor Yellow
    $tempZip = Join-Path $env:TEMP "antigravity-patched.zip"
    $tempDir = Join-Path $env:TEMP "antigravity-loc-$(Get-Random)"
    
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $tempZip -UseBasicParsing
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        Expand-Archive -Path $tempZip -DestinationPath $tempDir -Force
        $extractedAsar = Get-ChildItem -Path $tempDir -Filter "*app.asar*" | Select-Object -First 1
        if ($extractedAsar) {
            Copy-Item $extractedAsar.FullName $asarPath -Force
            $applied = $true
            Write-Host "[*] Пакет успешно загружен и применен." -ForegroundColor Green
        }
    } catch {
        Write-Host "[!] Не удалось автоматически загрузить с ${DownloadUrl}: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "[ИНФО] Вы можете запустить готовый AntigravityLocalizerSetup.exe офлайн без интернета." -ForegroundColor Yellow
    } finally {
        if (Test-Path $tempZip) { Remove-Item $tempZip -Force -ErrorAction SilentlyContinue }
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
    }
}

if (-not $applied) {
    Write-Host "[ОШИБКА] Не удалось установить пакет локализации." -ForegroundColor Red
    return
}

# 6. Запуск Antigravity с новым интерфейсом
if (Test-Path $exePath) {
    Write-Host "[*] Перезапуск Antigravity с новым интерфейсом..." -ForegroundColor Green
    Start-Process -FilePath $exePath
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [УСПЕХ] Локализатор успешно установлен!" -ForegroundColor Green
Write-Host " В верхнем баре справа от стрелок доступен флаг с выбором языков:" -ForegroundColor Green
Write-Host "   🇷🇺 Русский | 🇺🇦 Українська | 🇰🇿 Қазақша | 🇧🇾 Беларуская | 🇺🇿 O'zbekcha" -ForegroundColor Green
Write-Host " Горячая клавиша для смены языка: Alt + L" -ForegroundColor Green
Write-Host " Для отката к оригиналу выполните: install.ps1 -Restore" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

if (-not $Silent) {
    Write-Host "Для выхода нажмите Enter..."
    Read-Host
}

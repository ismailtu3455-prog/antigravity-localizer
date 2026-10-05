[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Continue'

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   🚀 Antigravity Localizer - Автоматический Деплой" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Проверяем статус git
if (-not (Test-Path ".git")) {
    git init
    git branch -M main
}

# 2. Индексируем файлы
Write-Host "📦 Индексация файлов..." -ForegroundColor Cyan
git add .

# Проверяем наличие незакоммиченных изменений
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Фиксация изменений (git commit)..." -ForegroundColor Yellow
    git commit -m "Release: Antigravity Multi-Language Localizer (CIS & En)"
} else {
    Write-Host "✅ Все файлы уже закоммичены." -ForegroundColor Green
}

# 3. Проверяем remote origin
$allRemotes = git remote
$origin = $null
if ($allRemotes -and ($allRemotes -contains 'origin')) {
    $origin = (git remote get-url origin).Trim()
}

if (-not $origin) {
    Write-Host ""
    Write-Host "🔗 Удаленный репозиторий еще не привязан!" -ForegroundColor Yellow
    Write-Host "1. Откройте в браузере страницу созданного репозитория на GitHub" -ForegroundColor White
    Write-Host "2. Скопируйте ссылку (например: https://github.com/ВАШ_НИК/antigravity-localizer.git)" -ForegroundColor White
    Write-Host ""
    $url = Read-Host "Вставьте ссылку на ваш GitHub репозиторий"
    if ([string]::IsNullOrWhiteSpace($url)) {
        Write-Host "❌ Ссылка не указана. Деплой отменен." -ForegroundColor Red
        return
    }
    git remote add origin $url.Trim()
    $origin = $url.Trim()
}

Write-Host ""
Write-Host ("🚀 Отправляем файлы на GitHub (" + $origin + ")...") -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 УСПЕШНО ОПУБЛИКОВАНО НА GITHUB!" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor DarkGray
    
    # Парсим юзера и имя репозитория
    if ($origin -match 'github\.com[:/]([^/]+)/([^/\.]+)') {
        $user = $matches[1]
        $repo = $matches[2]
        $rawUrl = "https://raw.githubusercontent.com/$user/$repo/main/install-standalone.ps1"
        $exeUrl = "https://github.com/$user/$repo/raw/main/AntigravityLocalizerSetup.exe"
        
        Write-Host ""
        Write-Host "🔥 ВАША КОМАНДА ДЛЯ УСТАНОВКИ В 1 СТРОКУ В POWERSHELL:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   irm $rawUrl | iex" -ForegroundColor White -BackgroundColor DarkBlue
        Write-Host ""
        Write-Host "Прямая ссылка для скачивания EXE-установщика:" -ForegroundColor Yellow
        Write-Host "   $exeUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Страница вашего репозитория:" -ForegroundColor Yellow
        Write-Host "   https://github.com/$user/$repo" -ForegroundColor Cyan
    }
    Write-Host "========================================================" -ForegroundColor DarkGray
} else {
    Write-Host ""
    Write-Host "⚠️ Ошибка при выполнении git push." -ForegroundColor Red
    Write-Host "Если вы создали репозиторий с файлом README или лицензией на сайте," -ForegroundColor Yellow
    Write-Host "выполните принудительную отправку командой: git push -f origin main" -ForegroundColor Yellow
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

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
$origin = (git remote get-url origin 2>$null)
if (-not $origin) {
    Write-Host ""
    Write-Host "🔗 Удаленный репозиторий еще не привязан!" -ForegroundColor Yellow
    Write-Host "1. Откройте в браузере: https://github.com/new" -ForegroundColor White
    Write-Host "2. Введите название репозитория (например: antigravity-localizer)" -ForegroundColor White
    Write-Host "3. Нажмите кнопку [Create repository]" -ForegroundColor White
    Write-Host "   (Не ставьте галочки Add README, .gitignore или License!)" -ForegroundColor DarkGray
    Write-Host "4. Скопируйте ссылку на созданный репозиторий." -ForegroundColor White
    Write-Host ""
    $url = Read-Host "Вставьте ссылку на ваш GitHub репозиторий (например, https://github.com/USERNAME/antigravity-localizer.git)"
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
    Write-Host "⚠️ Ошибка при выполнении git push. Проверьте права доступа к GitHub." -ForegroundColor Red
}

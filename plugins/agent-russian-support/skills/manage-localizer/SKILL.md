---
name: manage-localizer
description: >-
  Управление локализатором и русификатором интерфейса Antigravity 2.0 и Claude.
  Используйте для проверки статуса перевода, обновления словарей терминов или применения патчей.
---

# Управление локализатором интерфейса (UI Localizer)

Этот навык позволяет агенту и пользователю управлять переводом интерфейса приложений Antigravity и Claude.

## Доступные команды

1. **Проверить статус локализации**:
   ```bash
   node patcher.js --app antigravity --status
   node claude-patcher.js --status
   ```

2. **Собрать / обновить патч интерфейса Antigravity**:
   ```bash
   node patcher.js --app antigravity --install
   ```

3. **Русифицировать Claude Code CLI**:
   ```bash
   node claude-patcher.js --install
   ```

4. **Восстановить оригинал (откат)**:
   ```bash
   node patcher.js --app antigravity --restore
   node claude-patcher.js --restore
   ```

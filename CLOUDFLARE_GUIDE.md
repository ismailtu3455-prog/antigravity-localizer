# 📖 Настройка Cloudflare Worker для Antigravity

Бесплатный и стабильный способ обхода региональных ограничений для подключения к серверам Google Gemini API и Cloud Code.

---

## ⚠️ Важная информация о блокировках РКН

Если вы используете стандартный технический домен Cloudflare Workers (`*.workers.dev`), учтите, что он часто блокируется Роскомнадзором.

**Как решить:**
1. **Собственный домен (Лучший способ):** Привяжите к вашему Worker собственный домен во вкладке **Settings → Triggers → Custom Domains** в панели Cloudflare. В этом случае блокировки не страшны и сторонний софт не требуется.
2. **Использование Zapret / ByeDPI:** Если вы используете стандартный домен `*.workers.dev`, добавьте в [zapret](https://github.com/Flowseal/zapret-discord-youtube/) следующие домены:
   ```text
   cloudflare.com
   cloudflare.dev
   workers.dev
   ```

---

## Пошаговая иллюстрированная инструкция

### Шаг 1. Создание аккаунта в Cloudflare
1. Зарегистрируйтесь на сайте [dash.cloudflare.com](https://dash.cloudflare.com/) (или войдите в существующий).
2. **Обязательно подтвердите почту** с помощью письма, которое придет на ваш email.  
   *(Без подтверждения email Cloudflare не разрешит редактировать и разворачивать код).*

---

### Шаг 2. Раздел Workers & Pages
Слева в боковой панели выберите **Compute** → **Workers & Pages**:

<p align="center">
  <img src="https://github.com/user-attachments/assets/d81e3522-045a-4e65-9c2e-5545b7ad409a" alt="Workers & Pages" width="300" />
</p>

---

### Шаг 3. Создание приложения
1. Нажмите сверху справа синюю кнопку **`Create application`**:
   <p align="center">
     <img src="https://github.com/user-attachments/assets/7ac65944-8761-42a6-ab6d-ba5f9080c883" alt="Create application" />
   </p>

2. Выберите вкладку **`Start with Hello World!`**:
   <p align="center">
     <img src="https://github.com/user-attachments/assets/ff901439-c2a1-4867-95de-e11b82a37044" alt="Start with Hello World" width="550" />
   </p>

3. Нажмите кнопку **`Deploy`**:
   <p align="center">
     <img src="https://github.com/user-attachments/assets/bb68d49a-166d-42a0-8fe2-bd2b16c0d066" alt="Deploy Hello World" width="600" />
   </p>

---

### Шаг 4. Вставка кода реверс-прокси
1. В правом верхнем углу нажмите кнопку **`Edit code`**:
   <p align="center">
     <img src="https://github.com/user-attachments/assets/6bcdf839-d776-47e9-9d18-ba0efdf53244" alt="Edit code" />
   </p>

2. Замените весь код в редакторе слева на следующий JavaScript-код:
   <p align="center">
     <img src="https://github.com/user-attachments/assets/daf131ed-82d5-40f0-a7eb-daeb598bea40" alt="Code editor" width="750" />
   </p>

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const targetHost = 'generativelanguage.googleapis.com';
    url.hostname = targetHost;
    url.protocol = 'https:';
    url.port = '443';

    const headers = new Headers(request.headers);
    headers.set('Host', targetHost);

    const init = {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow'
    };

    return fetch(url.toString(), init);
  }
};
```

---

### Шаг 5. Деплой изменений
Сверху справа нажмите кнопку **`Deploy`**:

<p align="center">
  <img src="https://github.com/user-attachments/assets/58d8f83e-d8b5-40cf-a30f-741d7311047b" alt="Deploy code" width="400" />
</p>

---

### Шаг 6. Копирование адреса в Antigravity Hub
1. Скопируйте домен из поля справа (или ваш собственный домен):
   <p align="center">
     <img src="https://github.com/user-attachments/assets/4fb0b111-8026-4d17-b993-6c70ec37f1f5" alt="Copy domain" width="400" />
   </p>
   *(Пример адреса: `https://my-proxy.username.workers.dev`)*

2. Откройте **Antigravity Hub**, перейдите во вкладку **«Сеть и Прокси»**, выберите режим **Cloudflare** и вставьте ваш адрес в строку ввода.
3. Нажмите **`⚡ Проверить пинг`** — статус станет зеленым, подтверждая успешное соединение с серверами Google Gemini.

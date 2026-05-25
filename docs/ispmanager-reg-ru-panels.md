# Пошаговая инструкция для панели REG.RU (без поля «Дополнительные директивы nginx»)
#
# У вас режим сайта: FastCGI (Apache). Nginx настраивает хостинг — не вы.
# Поэтому поля nginx в форме редактирования сайта нет — это нормально.

## Что видно в вашей панели

Левое меню:
- Дашборд
- **Сайты** ← вы здесь
- Базы данных
- **Менеджер файлов** ← файлы сайта
- **Shell-клиент** ← терминал в браузере
- **Письмо в поддержку** ← запрос nginx-прокси

---

## ШАГ 1. Запустить бэкенд (Shell-клиент)

1. В левом меню нажмите **«Shell-клиент»** (не SSH с Mac — можно и так, но в панели проще).
2. Откроется чёрное окно с командной строкой.
3. Вводите команды **по одной**, Enter после каждой:

```bash
cd ~/edu-institutions-admission-catalog
```

Если ошибка «нет такой папки»:

```bash
find ~ -name "edu-institutions-admission-catalog" -type d 2>/dev/null
```

Перейдите в найденный путь:

```bash
cd ПУТЬ_ИЗ_КОМАНДЫ_ВЫШЕ
```

4. Проверка API:

```bash
curl -s http://127.0.0.1:8000/api/health
```

**Если `{"status":"ok"}`** — бэкенд уже работает, переходите к **ШАГ 3**.

**Если ошибка** — запустите бэкенд:

```bash
cd backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 > ~/api.log 2>&1 &
sleep 2
curl -s http://127.0.0.1:8000/api/health
```

Должно быть: `{"status":"ok"}`

---

## ШАГ 2. Если бэкенд не ставился — один раз

В Shell-клиенте:

```bash
cd ~/edu-institutions-admission-catalog
cp backend/.env.example backend/.env
nano backend/.env
```

Заполните (данные из **Базы данных → MySQL** в панели):

```env
DATABASE_URL=mysql+pymysql://ЛОГИН:ПАРОЛЬ@localhost/ИМЯ_БАЗЫ?charset=utf8mb4
JWT_SECRET=случайная-длинная-строка
CORS_ORIGINS=https://myproj76.ru,https://www.myproj76.ru
```

Сохранить: Ctrl+O, Enter, Ctrl+X.

```bash
make install-backend
make db-bootstrap
```

Затем снова запуск из шага 1.

---

## ШАГ 3. Написать в поддержку REG.RU (главное!)

Поля nginx в вашей форме **нет** — прокси `/api` может добавить только **поддержка хостинга**.

1. Левое меню → **«Письмо в поддержку»**.
2. Скопируйте текст из файла **`deploy/support-request-reg-ru.txt`** в репозитории  
   (или текст ниже).
3. Отправьте.

Готовый текст:

```
Тема: Проксирование /api для myproj76.ru

Здравствуйте!

Домен myproj76.ru, аккаунт u3499900.
Python API (Uvicorn) работает на http://127.0.0.1:8000 на этом сервере.

Нужно в nginx для myproj76.ru добавить:

location ^~ /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /api {
    return 301 /api/;
}

Сейчас https://myproj76.ru/api/health отдаёт HTML вместо JSON.
В ISPmanager у сайта нет поля «Дополнительные директивы nginx».

Спасибо!
```

Обычно отвечают от нескольких часов до 1–2 дней.

---

## ШАГ 4. Проверка после ответа поддержки

На Mac в Терминале:

```bash
curl -s https://myproj76.ru/api/health
```

Должно быть: `{"status":"ok"}`

В браузере:
- https://myproj76.ru/register — появятся города
- https://myproj76.ru/login — демо admin@edu.example / Admin12345

---

## ШАГ 5. Обновить файлы сайта (фронт)

1. **Менеджер файлов** в панели.
2. Откройте папку сайта (часто `www/myproj76.ru` или `data/www/myproj76.ru`).
3. Там лежат `index.html`, папка `assets/`.

На сервере в Shell-клиенте пересоберите и скопируйте:

```bash
cd ~/edu-institutions-admission-catalog
git pull
make build
```

Узнайте путь к сайту в **Менеджере файлов** (верхняя папка с index.html), затем:

```bash
rsync -a --delete frontend/dist/ /ПУТЬ/К/САЙТУ/
```

Пример (путь может отличаться!):

```bash
rsync -a --delete frontend/dist/ ~/www/myproj76.ru/
```

---

## Почему нет поля nginx

| Что у вас в панели | Что это значит |
|--------------------|----------------|
| Режим работы PHP: **FastCGI (Apache)** | Сайт через Apache |
| Поля nginx **нет** | Nginx настраивает REG.RU, не пользователь |
| `server: nginx` в ответах | Nginx спереди отдаёт статику (index.html) |

Поэтому `/api` попадает в index.html — нужен прокси от **поддержки**.

---

## Демо-аккаунты (после починки API)

| Email | Пароль |
|-------|--------|
| admin@edu.example | Admin12345 |
| user@edu.example | User12345 |

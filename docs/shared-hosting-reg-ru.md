# Shared-хостинг REG.RU без VPS (обход отказа поддержки)

REG.RU **не настраивает nginx** на виртуальном хостинге — это нормально для shared.
**VPS не обязателен.** MySQL на хостинге **остаётся** — к нему подключается Python на том же сервере.

## Схема

```
Браузер  →  myproj76.ru/api.php/api/...  (PHP, Apache)
                ↓
           Uvicorn :8000  (Python, Shell)
                ↓
           MySQL localhost  (база в ISPmanager)
```

- **Фронт** — статика (`index.html`, `assets/`)
- **api.php** — маленький PHP-прокси (REG.RU разрешает PHP)
- **Uvicorn** — ваш FastAPI, запускается в Shell-клиенте
- **MySQL** — как и планировалось для диплома

---

## Шаг 1. Shell-клиент — бэкенд

```bash
cd ~/edu-institutions-admission-catalog
git pull
make install-backend
make db-bootstrap
bash scripts/start-api-shared.sh
```

Проверка:

```bash
curl -s http://127.0.0.1:8000/api/health
```

→ `{"status":"ok"}`

---

## Важно: какой адрес открывать

| Адрес | Результат |
|-------|-----------|
| **https://myproj76.ru/** | ✅ работает |
| **https://myproj76.ru/login** | ✅ после `.htaccess` с SPA-правилом |
| **http://www.myproj76.ru** | ❌ 404 от REG.RU — **не используйте www** |
| **myproj76.ru** без https | может уйти на www → 404 |

**Открывайте только:** [https://myproj76.ru/login](https://myproj76.ru/login)

В ISPmanager у сайта можно включить редирект **www → без www** (раздел «Редирект домена»).

---

## Шаг 2. Менеджер файлов — api.php и фронт

### 2.1. Собрать фронт — **только на Mac**, не на server109

На shared-хостинге Node **~10** — Vite не запустится (`SyntaxError: Unexpected token {`).
**`make build` на сервере не нужен и не получится.**

**На Mac** (Терминал):

```bash
cd путь/к/edu-institutions-admission-catalog
git pull
make install-frontend
make build
```

После этого на Mac появится папка **`frontend/dist/`** с `index.html` и `assets/`.

### 2.2. Узнать папку сайта

**Менеджер файлов** → откройте каталог, где лежит `index.html` сайта myproj76.ru  
(часто `www/myproj76.ru` или `data/www/myproj76.ru`).

### 2.3. Скопировать файлы (Shell-клиент)

Подставьте свой путь вместо `~/www/myproj76.ru`:

```bash
rsync -a --delete ~/edu-institutions-admission-catalog/frontend/dist/ ~/www/myproj76.ru/
cp ~/edu-institutions-admission-catalog/deploy/api.php ~/www/myproj76.ru/api.php
```

### 2.4. Или через Менеджер файлов вручную

1. Загрузите в **корень сайта** (рядом с `index.html`):
   - **`deploy/api.php`**
   - **`deploy/htaccess.example`** → сохраните как **`.htaccess`** (с точкой! нужен для входа в аккаунт)
2. Замените `index.html` и папку `assets/` содержимым из `frontend/dist/` после `make build`.

---

## Шаг 3. Проверка

В Shell-клиенте:

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s https://myproj76.ru/api.php/api/health
```

Оба должны вернуть `{"status":"ok"}`.

В браузере:
- https://myproj76.ru/register — города в списке
- https://myproj76.ru/login — `admin@edu.example` / `Admin12345`

---

## Шаг 4. CRON — чтобы API не «засыпал»

Если сервер перезагрузится или Uvicorn упадёт — сайт перестанет логинить. CRON раз в 5 минут проверяет и поднимает API.

### 4.1. Узнайте путь к проекту (Shell-клиент)

```bash
cd ~/edu-institutions-admission-catalog && pwd
```

У вас скорее всего:

`/var/www/u3499900/data/edu-institutions-admission-catalog`

### 4.2. Планировщик CRON в панели

1. Левое меню → **«Планировщик CRON»**
2. **«Создать»** / **«Добавить задачу»**
3. Заполните:

| Поле | Значение |
|------|----------|
| **Минуты** | `*/5` (каждые 5 минут) |
| **Часы** | `*` |
| **День месяца** | `*` |
| **Месяц** | `*` |
| **День недели** | `*` |
| **Команда** | см. ниже |

**Команда** (подставьте свой путь из шага 4.1):

```bash
bash /var/www/u3499900/data/edu-institutions-admission-catalog/scripts/start-api-shared.sh >> /var/www/u3499900/data/cron-api.log 2>&1
```

4. **Сохранить**

> В некоторых версиях ISPmanager одно поле «Расписание» — тогда вставьте строку целиком из **`deploy/cron-reg-ru.example`**.

### 4.3. Проверка

Подождите 5 минут или в Shell-клиенте запустите команду из CRON вручную:

```bash
bash /var/www/u3499900/data/edu-institutions-admission-catalog/scripts/start-api-shared.sh
```

Должно быть: `OK: Uvicorn запущен` или `API уже работает`.

Лог CRON: **Менеджер файлов** → `cron-api.log` в домашней папке (`data/`).

Скрипт **не создаёт второй** Uvicorn, если API уже отвечает на `:8000`.

---

## Нужен ли VPS?

| | Shared (ваш тариф) | VPS |
|--|-------------------|-----|
| MySQL | ✅ в панели | нужно настраивать самому |
| nginx /api | ❌ поддержка отказала | ✅ полный контроль |
| **api.php обход** | ✅ работает | не нужен |
| Цена | уже оплачен | доп. деньги |

**Для диплома shared + api.php достаточно.**

---

## Демо-аккаунты

| Email | Пароль |
|-------|--------|
| admin@edu.example | Admin12345 |
| user@edu.example | User12345 |

Создаются при `make db-bootstrap`.

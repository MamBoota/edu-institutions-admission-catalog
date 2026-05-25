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

## Шаг 2. Менеджер файлов — api.php и фронт

### 2.1. Собрать фронт

**Проще — на своём Mac** (на shared-хостинге часто старый Node или мало памяти):

```bash
cd edu-institutions-admission-catalog
git pull
make install-frontend
make build
```

Затем через **Менеджер файлов** залейте содержимое `frontend/dist/` и `deploy/api.php` в корень сайта.

**Или на сервере** (Shell-клиент), если есть Node:

```bash
cd ~/edu-institutions-admission-catalog
git pull
node --version    # нужен 18+, иначе собирайте на Mac
make install-frontend
make build
```

Если `vite: команда не найдена` — сначала `make install-frontend`.

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

1. Загрузите файл **`deploy/api.php`** из репозитория в **корень сайта** (рядом с `index.html`).
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

**Планировщик CRON** в панели → новая задача:

| Поле | Значение |
|------|----------|
| Команда | `bash ~/edu-institutions-admission-catalog/scripts/start-api-shared.sh` |
| Период | каждые 5–10 минут |

Скрипт не запустит второй экземпляр, если API уже работает.

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

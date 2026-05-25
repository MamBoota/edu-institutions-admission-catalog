# REG.RU: домен `myproj76.ru`, MySQL и это приложение

Панель вида [ISPmanager на REG.RU](https://server109.hosting.reg.ru:1500/ispmgr) — типичный shared-хостинг. Пользователь и база в панели уже созданы — дальше только **конфиг и команды** (ниже и в репозитории).

## 0. Сразу после создания БД и пользователя

1. На машине, с которой **доступен MySQL** (часто только SSH на хостинг, не твой домашний ПК), склонируй репозиторий, создай `backend/.env` (см. §3).
2. Из корня репозитория:
   ```bash
   make install-backend
   make db-bootstrap
   ```
   Либо вручную: `cd backend && . .venv/bin/activate && python scripts/bootstrap_db.py`  
   Скрипт создаёт таблицы и заливает **сиды** (города, демо-учреждения, `admin@edu.example` / `user@edu.example`), если в таблице `users` ещё пусто.
3. Подними API (Uvicorn) и отдай фронт (`npm run build` → статика) — примеры в каталоге **`deploy/`** в репозитории.

## 1. Создать MySQL в ISPmanager

1. Войди в ISPmanager → раздел **«Базы данных»** / **MySQL** (название может чуть отличаться).
2. **Создать базу**: имя, например `u1234567_edu` (у REG.RU часто префикс от логина).
3. **Создать пользователя** БД (или привязать к существующему) и выдать ему **все права** на эту базу.
4. Запиши:
   - **хост** (часто `localhost` *если* PHP/скрипты крутятся **на этом же сервере**; для подключения **с другой машины** REG.RU иногда даёт отдельный хост вроде `server109.hosting.reg.ru` или `mysql5.hosting.reg.ru` — смотри подсказку в панели после создания БД);
   - **порт** (обычно `3306` для MySQL). **Не путать с `:1500` в адресе панели в браузере** — это порт веб-интерфейса ISPmanager, к MySQL он не относится.
   - **имя БД**, **логин**, **пароль**.

Кодировка в панели, если спросят: **utf8mb4**.

## 2. Важно: откуда будет ходить API

| Где крутится FastAPI | Подключение к MySQL на REG.RU |
|----------------------|--------------------------------|
| На **этом же** хостинге (Python по SSH/панели) | Часто хост **`localhost`** — нормально. |
| На **другом** сервере (домашний ПК, VPS) | Нужен **удалённый доступ** к MySQL. На shared у REG.RU он **часто выключен** или платный. Если подключиться нельзя — либо переноси API на хостинг, либо БД на VPS рядом с API. |

Итого: «сделать БД на хостинге» — да; «чтобы **локальный** `make start` ходил в эту БД» — только если REG.RU разрешит **внешний** доступ и ты откроешь firewall/белый список IP.

## 3. Строка подключения в приложении

В `backend/.env` (на сервере не коммить в git):

```env
DATABASE_URL=mysql+pymysql://u1234567_user:URL_ENCODED_PASSWORD@server109.hosting.reg.ru:3306/u1234567_edu?charset=utf8mb4
JWT_SECRET=случайная-длинная-строка
CORS_ORIGINS=https://myproj76.ru,https://www.myproj76.ru
```

**Не подставляйте** буквальные слова `HOST`, `USER`, кириллицу **«ХОСТ»** или «ИМЯ_БД» — нужны **реальные** логин, пароль, хост и имя базы из ISPmanager (часто хост `serverXXX.hosting.reg.ru` или с Mac недоступен — тогда только `localhost` **по SSH на сервере**).

Если в пароле есть `@`, `:`, `#` и т.п. — **URL-кодируй** пароль (например в Python: `from urllib.parse import quote_plus; print(quote_plus("пароль"))`).

### Ошибка 1045 «Access denied … (using password: YES)»

Сервер MySQL **доступен**, но логин/пароль не подошли **или** пользователю запрещено подключаться с вашего IP (в сообщении видно `user'…'@'ваш_IP'`). Что сделать:

1. В ISPmanager открой **пользователя этой базы** → смени пароль → вставь в `DATABASE_URL` заново (без опечаток; спецсимволы — через `quote_plus`).
2. Убедись, что в URL логин — **именно пользователь БД** (`u3499900_…`), а не логин FTP/панели, если они разные.
3. Если пользователь создан только для `localhost`, с домашнего интернета будет 1045 — либо включи у REG.RU доступ с внешних хостов для этого пользователя, либо выполни `make db-bootstrap` **по SSH на сервере** с хостом `localhost` в `DATABASE_URL`.

После первого запуска приложения с этим `DATABASE_URL` таблицы создадутся сами (`create_all`); сиды выполнятся на **пустой** БД (как при локальном SQLite). То же делает цель **`make db-bootstrap`** (скрипт `backend/scripts/bootstrap_db.py`).

## 4. Домен `myproj76.ru`

- В панели REG.RU / у регистратора: **A-запись** `@` и при необходимости `www` → **IP** той машины, где открыт сайт (IP хостинга или VPS).
- TLS (HTTPS) — по инструкции REG.RU (Let’s Encrypt в панели и т.д.).

Фронт в проде: `npm run build`, раздача статики через **Nginx** + прокси `/api` на Uvicorn.

### 4.1. Nginx: прокси `/api` (обязательно)

Сейчас на [myproj76.ru](https://myproj76.ru/) открывается фронт, но запросы к `/api/*` отдают HTML вместо JSON — **Nginx не проксирует API на Uvicorn**.

**ISPmanager (REG.RU shared):**

1. **Сайты** → **myproj76.ru** → **Изменить** (или «Nginx» / «Конфигурация»).
2. Поле **«Дополнительные директивы nginx»** — вставьте содержимое файла [`deploy/ispmanager-nginx-snippet.conf`](../deploy/ispmanager-nginx-snippet.conf).
3. Сохраните и дождитесь перезагрузки Nginx.

**VPS / свой Nginx:** полный vhost — [`deploy/nginx-myproj76.conf.example`](../deploy/nginx-myproj76.conf.example).

### 4.2. Uvicorn (systemd)

1. Склонируйте репозиторий на сервер, например в `/var/www/edu-catalog/repo`.
2. Создайте `backend/.env` (см. §3).
3. Установите unit:
   ```bash
   sudo cp deploy/uvicorn-edu-catalog.service.example /etc/systemd/system/edu-catalog-api.service
   sudo nano /etc/systemd/system/edu-catalog-api.service   # User, пути к repo и .venv
   sudo systemctl daemon-reload
   sudo systemctl enable --now edu-catalog-api
   ```
4. Проверка **на сервере**:
   ```bash
   curl -s http://127.0.0.1:8000/api/health
   # {"status":"ok"}
   ```

### 4.3. Деплой одной командой (на сервере по SSH)

```bash
git pull
export WEB_ROOT=/var/www/ВАШ_ЛОГИН/data/www/myproj76.ru   # каталог сайта из ISPmanager
bash scripts/deploy-prod.sh
```

`WEB_ROOT` — каталог, куда уже залит фронт (там лежит `index.html`).

### 4.4. Проверка с вашего ПК

```bash
make prod-check
# или: bash scripts/prod-check.sh
```

Ожидается:
```bash
curl -s https://myproj76.ru/api/health
{"status":"ok"}
```

## 5. Диагностика

| Симптом | Причина | Решение |
|---------|---------|---------|
| `/api/health` возвращает HTML страницы входа | Nginx отдаёт SPA вместо прокси | §4.1 — snippet для nginx |
| `curl 127.0.0.1:8000/api/health` на сервере не работает | Uvicorn не запущен / ошибка `.env` | `systemctl status edu-catalog-api`, `journalctl -u edu-catalog-api -n 50` |
| 502 на `/api/*` | Uvicorn упал или порт не 8000 | Проверить systemd, MySQL в `.env` |
| 1045 MySQL | Неверный пароль или хост | §3, bootstrap только **по SSH** с `localhost` |
| CORS в браузере | Нет origin в `CORS_ORIGINS` | Добавить `https://myproj76.ru` в `backend/.env` |

## 6. Файлы в репозитории

- Драйвер: **`pymysql`** в `backend/requirements.txt`.
- Пример переменных: `backend/.env.example`.
- Инициализация БД: **`make db-bootstrap`** → `backend/scripts/bootstrap_db.py`.
- DDL для отчёта УП.11 под MySQL: `sql/01_schema_mysql.sql`.
- Примеры веб-сервера и сервиса API: **`deploy/nginx-myproj76.conf.example`**, **`deploy/ispmanager-nginx-snippet.conf`**, **`deploy/uvicorn-edu-catalog.service.example`**.
- Скрипты: **`scripts/deploy-prod.sh`** (деплой на сервере), **`scripts/prod-check.sh`** (проверка с ПК).

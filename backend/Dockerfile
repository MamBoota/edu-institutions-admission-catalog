FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей (если нужны для psycopg2 и т.д.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копирование зависимостей
COPY requirements.txt .

# Установка Python пакетов
RUN pip install --no-cache-dir -r requirements.txt

# Копирование всего кода приложения
COPY . .

# Переменная окружения для Python (буферизация вывода)
ENV PYTHONUNBUFFERED=1

# Порт, который слушает FastAPI
EXPOSE 8000

# Команда запуска (uvicorn)
# Замени 'app.main:app' на свой путь, если точка входа другая
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
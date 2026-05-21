# Этап 1: Сборка проекта
FROM node:18-alpine as build

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем исходный код
COPY . .

# Аргумент для API (можно переопределить при сборке)
ARG VITE_API_BASE=http://localhost:8000
ENV VITE_API_BASE=$VITE_API_BASE

# Сборка production версии
RUN npm run build

# Этап 2: Раздача через Nginx
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг Nginx (чтобы роутинг React работал корректно)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
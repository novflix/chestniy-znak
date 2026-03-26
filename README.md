# 🏷️ Система маркировки товаров (MVP)

Информационная система для маркировки товаров — аналог «Честный знак».
Генерирует уникальные коды, верифицирует их и ведёт аудит действий.

---

## 📋 Стек технологий

| Слой | Технологии |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Axios |
| Backend | Node.js, Express.js, JWT, bcrypt |
| База данных | PostgreSQL |
| Тесты | Jest + Supertest |

---

## 🗂️ Структура проекта

```
marking-system/
├── backend/
│   └── src/
│       ├── config/          # БД, схема SQL, сид данные
│       ├── controllers/     # HTTP-обработчики
│       ├── services/        # Бизнес-логика
│       ├── repositories/    # Работа с БД
│       ├── middleware/       # Auth, logger, validate
│       ├── routes/          # Express роутеры
│       └── tests/           # Jest + Supertest тесты
└── frontend/
    └── src/
        ├── app/             # Next.js App Router страницы
        ├── components/      # AuthContext, Sidebar
        ├── services/        # Axios API клиент
        └── types/           # TypeScript типы
```

---

## 🚀 Быстрый запуск

### 1. Требования

- Node.js 18+
- PostgreSQL 14+

### 2. База данных

```bash
# Создать БД
psql -U postgres -c "CREATE DATABASE marking_system;"
```

### 3. Backend

```bash
cd backend

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env
# Отредактировать DATABASE_URL в .env

# Создать таблицы и заполнить тестовыми данными (100+ записей)
npm run seed

# Запустить сервер разработки
npm run dev
# Сервер: http://localhost:4000
```

### 4. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Настроить окружение
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

# Запустить
npm run dev
# Интерфейс: http://localhost:3000
```

---

## 🔑 Демо-аккаунты (после seed)

| Email | Пароль | Роль |
|---|---|---|
| admin@marking.ru | admin123 | ADMIN |
| user@marking.ru | user123 | USER |
| manager@marking.ru | user123 | USER |

---

## 📊 База данных (схема)

```sql
users    — пользователи (id, email, password_hash, role)
products — товары (id, name, category, description, created_by)
codes    — коды маркировки (id, product_id, code, status, created_by, used_at)
logs     — журнал действий (id, user_id, action, details, ip_address, timestamp)
```

**Тестовые данные (seed):**
- 3 пользователя (1 ADMIN + 2 USER)
- 50 товаров (10 категорий × 5 товаров)
- 120 кодов (60 valid + 30 used + 30 invalid)
- 60 записей в журнале

---

## 🔌 API endpoints

### Auth

```
POST /auth/register    Регистрация
POST /auth/login       Вход
POST /auth/logout      Выход (auth required)
GET  /auth/me          Текущий пользователь (auth required)
```

### Products (требует авторизации)

```
GET  /products           Список товаров (с пагинацией и фильтром)
GET  /products/categories Список категорий
GET  /products/:id       Товар по ID
POST /products           Создать товар
```

### Codes (требует авторизации)

```
POST /codes/generate    Генерировать код(ы)
POST /codes/verify      Проверить код
GET  /codes/stats       Статистика кодов
```

### Logs (требует авторизации)

```
GET /logs   Журнал действий (ADMIN видит все, USER — только свои)
```

---

## 📡 Примеры запросов

### Авторизация
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marking.ru","password":"admin123"}'
```

### Создать товар
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Смартфон OnePlus","category":"Электроника","description":"Флагман 2024"}'
```

### Генерировать 5 кодов
```bash
curl -X POST http://localhost:4000/codes/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"productId":"<UUID>","count":5}'
```

### Проверить код
```bash
curl -X POST http://localhost:4000/codes/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"code":"MRK-AB12-CD34-EF56-GH78","markAsUsed":false}'
```

### Ответ при действительном коде
```json
{
  "valid": true,
  "status": "valid",
  "message": "Код маркировки действителен.",
  "code": "MRK-AB12-CD34-EF56-GH78",
  "product": { "name": "Смартфон OnePlus", "category": "Электроника" },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Тесты

```bash
cd backend

# Запустить все тесты (требует запущенную БД с seed данными)
npm test

# Тесты покрывают:
# ✓ POST /auth/login (valid, invalid creds, invalid email)
# ✓ POST /auth/register (success, duplicate, short password)
# ✓ GET /products (auth, pagination)
# ✓ POST /products (create, validation)
# ✓ POST /codes/generate (success, not found product, count > 100)
# ✓ POST /codes/verify (valid, not found, mark as used)
# ✓ GET /logs (admin access)
```

---

## 🔐 Безопасность

- JWT токены в **HttpOnly cookie** (защита от XSS)
- Токен также в `Authorization: Bearer` заголовке для API-клиентов
- Пароли хешируются через **bcrypt (cost 12)**
- Middleware проверки роли (`requireAdmin`)
- Все неавторизованные запросы → 401

---

## 🎨 Формат кодов маркировки

```
MRK-XXXX-XXXX-XXXX-XXXX
    ^^^^ ^^^^ ^^^^ ^^^^
    Каждый сегмент: A-Z, 0-9
    
Пример: MRK-A1B2-C3D4-E5F6-G7H8
```

---

## 🖥️ Страницы приложения

| Путь | Описание |
|---|---|
| `/auth` | Вход / Регистрация с демо-кнопками |
| `/dashboard` | Статистика + быстрые действия |
| `/products` | Список товаров с созданием |
| `/codes` | Генерация и проверка кодов |
| `/logs` | Журнал аудита с деталями |

---

## 🏗️ Архитектура

```
HTTP Request
    ↓
Routes (Express Router)
    ↓
Middleware (authenticate → validate)
    ↓
Controllers (parse request, return response)
    ↓
Services (business logic)
    ↓
Repositories (SQL queries via pg Pool)
    ↓
PostgreSQL
```

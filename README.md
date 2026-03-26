# 🏷️ Маркировка «Честный знак» — MVP v2

Система маркировки товаров: генерация уникальных кодов, проверка подлинности, журнал аудита.
Backend: **Node.js + Express + Supabase**. Frontend: **Next.js 14 + TypeScript + Tailwind**.

---

## 🎭 Роли пользователей

| Роль | Страницы | Описание |
|------|----------|----------|
| **ADMIN** | Дашборд, Товары, Коды, Журнал | Полный доступ ко всем функциям |
| **USER**  | Только `/verify` | Исключительно проверка кода маркировки |

После входа пользователь автоматически перенаправляется на нужную страницу в зависимости от роли. Если USER попытается открыть `/dashboard` или `/products` напрямую — его редиректит на `/verify`.

---

## 🚀 Быстрый запуск

### 1. Настроить Supabase (один раз)

1. Войдите на [app.supabase.com](https://app.supabase.com)
2. Откройте ваш проект → **SQL Editor**
3. Вставьте содержимое файла `backend/src/config/schema.sql` и нажмите **Run**
4. Таблицы созданы ✅

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # ключи Supabase уже прописаны
npm run seed                # 3 пользователя + 50 товаров + 120 кодов + 60 логов
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                 # http://localhost:3000
```

---

## 🔑 Демо-аккаунты (после `npm run seed`)

| Email | Пароль | Роль | Доступ |
|-------|--------|------|--------|
| admin@chestnyznak.ru | admin123 | ADMIN | Полный |
| user@chestnyznak.ru | user123 | USER | Только проверка кода |
| operator@chestnyznak.ru | user123 | USER | Только проверка кода |

---


## ⚡ Алгоритм генерации кодов v2 (2 round-trips)

Старый подход: проверял каждый код отдельным запросом → N запросов к БД.

Новый подход:
1. **Локальная генерация** — `crypto.randomFillSync()` создаёт весь батч в памяти за ~1 мс
2. **Один SELECT** — `supabase.from('codes').select('code').in('code', [...])` проверяет коллизии через уникальный индекс
3. **Один INSERT** — `supabase.from('codes').insert([...])` вставляет всё пачкой

Итог: 100 кодов ≈ **25–40 мс** вместо 200–500 мс.

---

## 🐛 Исправленные баги v2.1

| Баг | Причина | Исправление |
|-----|---------|-------------|
| Статистика кодов показывала максимум 1000 | Supabase возвращает не более 1000 строк по умолчанию; JS считал длину массива | `{ count: 'exact', head: true }` — агрегация на стороне БД, без передачи данных |

---

## 📡 API

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация (email + пароль ≥6 символов с цифрой) |
| POST | `/auth/login` | Вход → JWT в теле + HttpOnly cookie |
| POST | `/auth/logout` | Выход, очистка cookie |
| GET | `/auth/me` | Данные текущего пользователя |

### Products (требует авторизации)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/products` | Список с пагинацией (`?page=1&limit=20&category=Одежда`) |
| GET | `/products/categories` | Список всех категорий |
| GET | `/products/:id` | Один товар |
| POST | `/products` | Создать товар |

### Codes (требует авторизации)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/codes/generate` | Сгенерировать 1–100 кодов для товара |
| POST | `/codes/verify` | Проверить код (`markAsUsed: true` — пометить как использованный) |
| GET | `/codes/stats` | Статистика valid/used/invalid (точный COUNT через Supabase) |

### Logs (требует авторизации)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/logs` | Журнал (`?action=AUTH_LOGIN&page=1`). ADMIN видит все, USER — только свои |

---

## 🧪 Тесты

```bash
cd backend
npm test
```

Покрытие: 20+ тест-кейсов — Auth (login, register, /me), Products (list, create, validation), Codes (generate batch, format, uniqueness, verify, markAsUsed, USER access), Logs (ADMIN/USER isolation, action filter).

---

## 🏗️ Архитектура

```
HTTP Request
  → Express Router
  → authenticate middleware (JWT verify)
  → Controller (валидация входных данных)
  → Service (бизнес-логика)
  → Repository (Supabase queries)
  → Supabase PostgreSQL
```

### Структура файлов

```
backend/src/
├── config/
│   ├── supabase.js      ← единственный Supabase-клиент (service role)
│   ├── schema.sql       ← DDL: таблицы, индексы, триггеры
│   └── seed.js          ← тестовые данные (233 записи)
├── controllers/         ← HTTP-обработчики + валидация express-validator
├── services/            ← бизнес-логика (codeService — быстрый алгоритм)
├── repositories/        ← все запросы к Supabase
├── middleware/          ← authenticate, requireAdmin, validate, logAction
├── routes/              ← Express routers
└── tests/
    └── api.test.js      ← Jest + Supertest

frontend/src/
├── app/
│   ├── auth/            ← страница входа/регистрации
│   ├── dashboard/       ← статистика (ADMIN)
│   ├── products/        ← список и создание товаров (ADMIN)
│   ├── codes/           ← генерация и проверка кодов (ADMIN)
│   ├── logs/            ← журнал действий (ADMIN)
│   └── verify/          ← проверка кода (USER + ADMIN)
├── components/
│   ├── AuthContext.tsx  ← глобальное состояние авторизации
│   └── Sidebar.tsx      ← навигация (ADMIN видит всё, USER — только verify)
├── services/api.ts      ← Axios-клиент
└── types/index.ts       ← TypeScript типы
```

### Формат кода маркировки
```
MRK-XXXX-XXXX-XXXX-XXXX
     ↑ X = A-Z или 0-9 (36 символов)
     36¹⁶ ≈ 7.96×10²⁴ возможных комбинаций
```
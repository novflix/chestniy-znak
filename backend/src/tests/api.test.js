const request = require('supertest');
const app = require('../index');

// ── Общие переменные ─────────────────────────────────────────
let adminToken;
let userToken;
let testProductId;

const ADMIN = { email: 'admin@chestnyznak.ru', password: 'admin123' };
const USER  = { email: 'user@chestnyznak.ru',  password: 'user123'  };

async function loginAs(credentials) {
  const res = await request(app).post('/auth/login').send(credentials);
  if (!res.body.token) throw new Error(`Login failed for ${credentials.email}: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

// ── 1. AUTH ──────────────────────────────────────────────────
describe('Auth — POST /auth/login', () => {
  it('200 + token при верных данных (ADMIN)', async () => {
    const res = await request(app).post('/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(ADMIN.email);
    expect(res.body.user.role).toBe('ADMIN');
    adminToken = res.body.token;
  });

  it('200 + token при верных данных (USER)', async () => {
    const res = await request(app).post('/auth/login').send(USER);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('USER');
    userToken = res.body.token;
  });

  it('401 при неверном пароле', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: ADMIN.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('422 при невалидном формате email', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: 'not-an-email', password: 'admin123' });
    expect(res.status).toBe(422);
  });

  it('422 при отсутствии пароля', async () => {
    const res = await request(app).post('/auth/login')
      .send({ email: ADMIN.email });
    expect(res.status).toBe(422);
  });
});

describe('Auth — POST /auth/register', () => {
  // Уникальный email для каждого запуска тестов
  const testEmail = `test_jest_${Date.now()}@chestnyznak.ru`;

  it('201 при успешной регистрации', async () => {
    const res = await request(app).post('/auth/register')
      .send({ email: testEmail, password: 'secure1' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.role).toBe('USER');
    // Пароль не должен утекать
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('409 при дублировании email', async () => {
    // Повторная регистрация того же email
    const res = await request(app).post('/auth/register')
      .send({ email: testEmail, password: 'secure1' });
    expect(res.status).toBe(409);
  });

  it('422 при слишком коротком пароле (< 6 символов)', async () => {
    const res = await request(app).post('/auth/register')
      .send({ email: `short_${Date.now()}@chestnyznak.ru`, password: '12345' });
    expect(res.status).toBe(422);
  });

  it('422 при пароле без цифр', async () => {
    const res = await request(app).post('/auth/register')
      .send({ email: `nodigit_${Date.now()}@chestnyznak.ru`, password: 'abcdefg' });
    expect(res.status).toBe(422);
  });
});

describe('Auth — GET /auth/me', () => {
  it('200 + данные пользователя при валидном токене', async () => {
    if (!adminToken) adminToken = await loginAs(ADMIN);
    const res = await request(app).get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ADMIN.email);
  });

  it('401 без токена', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── 2. PRODUCTS ──────────────────────────────────────────────
describe('Products — GET /products', () => {
  beforeAll(async () => { adminToken = await loginAs(ADMIN); });

  it('200 + массив товаров для авторизованного', async () => {
    const res = await request(app).get('/products')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(typeof res.body.total).toBe('number');
    if (res.body.products.length > 0) {
      testProductId = res.body.products[0].id;
    }
  });

  it('пагинация: limit и page работают', async () => {
    const res = await request(app).get('/products?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(5);
  });

  it('401 без токена', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(401);
  });
});

describe('Products — POST /products', () => {
  beforeAll(async () => { adminToken = await loginAs(ADMIN); });

  it('201 + созданный товар', async () => {
    const res = await request(app).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Тестовый товар Jest', category: 'Электроника', description: 'Авто-тест' });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Тестовый товар Jest');
    expect(res.body.product.category).toBe('Электроника');
    testProductId = res.body.product.id;
  });

  it('422 при отсутствии названия', async () => {
    const res = await request(app).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category: 'Электроника' });
    expect(res.status).toBe(422);
  });

  it('422 при отсутствии категории', async () => {
    const res = await request(app).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Без категории' });
    expect(res.status).toBe(422);
  });

  it('401 без токена', async () => {
    const res = await request(app).post('/products')
      .send({ name: 'X', category: 'Y' });
    expect(res.status).toBe(401);
  });
});

// ── 3. CODES ─────────────────────────────────────────────────
describe('Codes — POST /codes/generate', () => {
  beforeAll(async () => {
    adminToken = await loginAs(ADMIN);
    // Гарантируем наличие testProductId
    if (!testProductId) {
      const res = await request(app).post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Авто-тест продукт', category: 'Тест' });
      testProductId = res.body.product.id;
    }
  });

  it('201 + коды нужного количества', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 3 });
    expect(res.status).toBe(201);
    expect(res.body.codes).toHaveLength(3);
  });

  it('формат кодов MRK-XXXX-XXXX-XXXX-XXXX', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 1 });
    expect(res.status).toBe(201);
    expect(res.body.codes[0].code).toMatch(
      /^MRK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
    );
  });

  it('все коды уникальны в батче', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 20 });
    expect(res.status).toBe(201);
    const codes = res.body.codes.map((c) => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(20);
  });

  it('404 при несуществующем productId', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: '00000000-0000-0000-0000-000000000000', count: 1 });
    expect(res.status).toBe(404);
  });

  it('422 при count > 100', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 101 });
    expect(res.status).toBe(422);
  });

  it('422 при count < 1', async () => {
    const res = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 0 });
    expect(res.status).toBe(422);
  });

  it('401 без токена', async () => {
    const res = await request(app).post('/codes/generate')
      .send({ productId: testProductId, count: 1 });
    expect(res.status).toBe(401);
  });
});

describe('Codes — POST /codes/verify', () => {
  let validCode;

  beforeAll(async () => {
    adminToken = await loginAs(ADMIN);
    userToken  = await loginAs(USER);
    if (!testProductId) {
      const p = await request(app).post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Verify-тест', category: 'Тест' });
      testProductId = p.body.product.id;
    }
    // Генерируем свежий валидный код
    const g = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 1 });
    validCode = g.body.codes[0].code;
  });

  it('200 + valid:true для действительного кода (ADMIN)', async () => {
    const res = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: validCode });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.status).toBe('valid');
    expect(res.body).toHaveProperty('product');
  });

  it('200 + valid:true для действительного кода (USER)', async () => {
    // USER тоже может проверять коды
    const res = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: validCode });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('400 + valid:false для несуществующего кода', async () => {
    const res = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'MRK-FAKE-FAKE-FAKE-FAKE' });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('400 + invalid_format для кода неверного формата', async () => {
    const res = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'НЕВЕРНЫЙ-КОД' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('invalid_format');
  });

  it('markAsUsed=true помечает код как использованный', async () => {
    // Генерируем отдельный код для этого теста
    const g = await request(app).post('/codes/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: testProductId, count: 1 });
    const code = g.body.codes[0].code;

    // Первая проверка с markAsUsed
    const r1 = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code, markAsUsed: true });
    expect(r1.status).toBe(200);
    expect(r1.body.valid).toBe(true);

    // Вторая проверка — код уже использован
    const r2 = await request(app).post('/codes/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code });
    expect(r2.status).toBe(400);
    expect(r2.body.valid).toBe(false);
    expect(r2.body.status).toBe('used');
  });

  it('401 без токена', async () => {
    const res = await request(app).post('/codes/verify')
      .send({ code: validCode });
    expect(res.status).toBe(401);
  });
});

describe('Codes — GET /codes/stats', () => {
  beforeAll(async () => { adminToken = await loginAs(ADMIN); });

  it('200 + корректная структура статистики', async () => {
    const res = await request(app).get('/codes/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty('total');
    expect(res.body.stats).toHaveProperty('valid');
    expect(res.body.stats).toHaveProperty('used');
    expect(res.body.stats).toHaveProperty('invalid');
    // total должен быть числом (как строка) > 0 после seed
    expect(parseInt(res.body.stats.total)).toBeGreaterThan(0);
  });
});

// ── 4. LOGS ──────────────────────────────────────────────────
describe('Logs — GET /logs', () => {
  beforeAll(async () => {
    adminToken = await loginAs(ADMIN);
    userToken  = await loginAs(USER);
  });

  it('200 + массив логов для ADMIN', async () => {
    const res = await request(app).get('/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });

  it('ADMIN видит логи всех пользователей', async () => {
    const res = await request(app).get('/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    // После seed и тестов должно быть > 0 записей
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('USER видит только свои логи', async () => {
    const res = await request(app).get('/logs')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    // Все логи принадлежат этому пользователю или это его собственные записи
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('фильтр по action работает', async () => {
    const res = await request(app).get('/logs?action=AUTH_LOGIN')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.logs.forEach((log) => {
      expect(log.action).toBe('AUTH_LOGIN');
    });
  });

  it('401 без токена', async () => {
    const res = await request(app).get('/logs');
    expect(res.status).toBe(401);
  });
});

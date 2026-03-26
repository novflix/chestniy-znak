const request = require('supertest');
const app = require('../src/index');

// ── Helpers ──────────────────────────────────────────────────
let authToken;
let testProductId;

const adminCredentials = { email: 'admin@marking.ru', password: 'admin123' };

async function loginAsAdmin() {
  const res = await request(app)
    .post('/auth/login')
    .send(adminCredentials);
  return res.body.token;
}

// ── Auth Tests ───────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('returns 200 and token with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(adminCredentials);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(adminCredentials.email);
    authToken = res.body.token;
  });

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@marking.ru', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 422 with invalid email format', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'admin123' });

    expect(res.status).toBe(422);
  });
});

describe('POST /auth/register', () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;

  it('creates user and returns 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'secure1' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('returns 409 on duplicate email', async () => {
    await request(app).post('/auth/register').send({ email: uniqueEmail, password: 'secure1' });
    const res = await request(app)
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'secure1' });

    expect(res.status).toBe(409);
  });

  it('returns 422 if password is too short', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'short@example.com', password: '123' });

    expect(res.status).toBe(422);
  });
});

// ── Products Tests ───────────────────────────────────────────
describe('GET /products', () => {
  beforeAll(async () => {
    authToken = await loginAsAdmin();
  });

  it('returns product list for authenticated user', async () => {
    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body).toHaveProperty('total');

    if (res.body.products.length > 0) {
      testProductId = res.body.products[0].id;
    }
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(401);
  });
});

describe('POST /products', () => {
  beforeAll(async () => {
    authToken = await loginAsAdmin();
  });

  it('creates a product and returns 201', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Тестовый товар Jest', category: 'Электроника', description: 'Тест' });

    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe('Тестовый товар Jest');
    testProductId = res.body.product.id;
  });

  it('returns 422 if name is missing', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ category: 'Электроника' });

    expect(res.status).toBe(422);
  });
});

// ── Codes Tests ──────────────────────────────────────────────
describe('POST /codes/generate', () => {
  beforeAll(async () => {
    authToken = await loginAsAdmin();
    if (!testProductId) {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Код-тест', category: 'Тест' });
      testProductId = res.body.product.id;
    }
  });

  it('generates codes for a valid product', async () => {
    const res = await request(app)
      .post('/codes/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: testProductId, count: 3 });

    expect(res.status).toBe(201);
    expect(res.body.codes).toHaveLength(3);
    expect(res.body.codes[0].code).toMatch(/^MRK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app)
      .post('/codes/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: '00000000-0000-0000-0000-000000000000', count: 1 });

    expect(res.status).toBe(404);
  });

  it('returns 422 for count > 100', async () => {
    const res = await request(app)
      .post('/codes/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: testProductId, count: 999 });

    expect(res.status).toBe(422);
  });
});

describe('POST /codes/verify', () => {
  let validCode;

  beforeAll(async () => {
    authToken = await loginAsAdmin();
    if (!testProductId) {
      const prod = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Верификация-тест', category: 'Тест' });
      testProductId = prod.body.product.id;
    }
    const genRes = await request(app)
      .post('/codes/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: testProductId, count: 1 });
    validCode = genRes.body.codes[0].code;
  });

  it('verifies a valid code', async () => {
    const res = await request(app)
      .post('/codes/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: validCode });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.status).toBe('valid');
  });

  it('returns invalid for non-existent code', async () => {
    const res = await request(app)
      .post('/codes/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'MRK-FAKE-CODE-DOES-NOTX' });

    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('marks code as used when markAsUsed=true', async () => {
    const gen = await request(app)
      .post('/codes/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: testProductId, count: 1 });
    const code = gen.body.codes[0].code;

    const res = await request(app)
      .post('/codes/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code, markAsUsed: true });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);

    // Second verify should show "used"
    const res2 = await request(app)
      .post('/codes/verify')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code });

    expect(res2.body.valid).toBe(false);
    expect(res2.body.status).toBe('used');
  });
});

// ── Logs Tests ───────────────────────────────────────────────
describe('GET /logs', () => {
  beforeAll(async () => {
    authToken = await loginAsAdmin();
  });

  it('returns logs for admin', async () => {
    const res = await request(app)
      .get('/logs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });
});

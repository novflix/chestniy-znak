const pool = require('./database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// ============================================================
// SEED DATA - 100+ records
// ============================================================

const CATEGORIES = [
  'Электроника', 'Одежда', 'Обувь', 'Продукты питания',
  'Лекарства', 'Косметика', 'Ювелирные изделия', 'Игрушки',
  'Автозапчасти', 'Бытовая химия'
];

const PRODUCT_NAMES = {
  'Электроника': ['Смартфон Samsung Galaxy', 'Ноутбук Lenovo IdeaPad', 'Планшет Apple iPad', 'Наушники Sony WH', 'Телевизор LG OLED', 'Фотоаппарат Canon EOS', 'Умные часы Xiaomi', 'Powerbank Anker', 'Клавиатура Logitech', 'Мышь Razer DeathAdder'],
  'Одежда': ['Куртка зимняя мужская', 'Платье вечернее женское', 'Джинсы классические', 'Футболка хлопковая', 'Свитер вязаный', 'Рубашка офисная', 'Пальто кашемировое', 'Худи спортивное', 'Брюки льняные', 'Блузка шёлковая'],
  'Обувь': ['Кроссовки Nike Air Max', 'Туфли кожаные классические', 'Сапоги зимние женские', 'Ботинки мужские', 'Сандалии летние', 'Слипоны Vans', 'Мокасины замшевые', 'Кеды Converse All Star', 'Угги UGG Australia', 'Балетки женские'],
  'Продукты питания': ['Кофе арабика 1кг', 'Чай черный байховый', 'Шоколад темный 85%', 'Мед натуральный горный', 'Оливковое масло Extra Virgin', 'Макароны из твёрдых сортов', 'Рис длиннозёрный', 'Консервы тунец', 'Варенье клубничное', 'Мюсли с орехами'],
  'Лекарства': ['Парацетамол 500мг', 'Ибупрофен 400мг', 'Витамин C 1000мг', 'Омега-3 капсулы', 'Мультивитамины Centrum', 'Аспирин кардио', 'Магний B6', 'Валериана экстракт', 'Но-шпа 40мг', 'Фосфалюгель суспензия'],
  'Косметика': ['Крем для лица SPF50', 'Шампунь Loreal Elseve', 'Маска для волос Pantene', 'Помада матовая Mac', 'Тушь для ресниц Maybelline', 'Духи Chanel No5', 'Гель для душа Dove', 'Скраб сахарный для тела', 'Сыворотка с гиалуроном', 'Тоник для лица'],
  'Ювелирные изделия': ['Кольцо золотое с бриллиантом', 'Серьги серебряные', 'Браслет из жёлтого золота', 'Цепочка белое золото', 'Подвеска с аметистом', 'Часы Tissot механика', 'Брошь с жемчугом', 'Кулон сердце', 'Обручальное кольцо', 'Перстень с рубином'],
  'Игрушки': ['Конструктор LEGO Technic', 'Кукла Barbie Fashionista', 'Машинка Hot Wheels', 'Настольная игра Монополия', 'Пазл 1000 деталей', 'Мягкая игрушка Медвежонок', 'Радиоуправляемый вертолёт', 'Набор для рисования', 'Скейтборд детский', 'Велосипед 20 дюймов'],
  'Автозапчасти': ['Масляный фильтр Bosch', 'Тормозные колодки Brembo', 'Аккумулятор Varta 60Ah', 'Свечи зажигания NGK', 'Ремень ГРМ Gates', 'Амортизатор KYB передний', 'Воздушный фильтр Mann', 'Антифриз G12 красный', 'Моторное масло 5W30', 'Щётки стеклоочистителя'],
  'Бытовая химия': ['Стиральный порошок Ariel 3кг', 'Гель для посуды Fairy', 'Чистящее средство Cillit Bang', 'Кондиционер для белья Lenor', 'Таблетки для посудомойки Finish', 'Освежитель воздуха Glade', 'Средство для унитаза Duck', 'Антисептик спиртовой', 'Средство от накипи', 'Хозяйственное мыло']
};

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return `MRK-${segments.join('-')}`;
}

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seed...');
    
    await client.query('BEGIN');

    // ---- Create schema ----
    const fs = require('fs');
    const schema = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    await client.query(schema);
    console.log('✅ Schema created');

    // ---- Create users ----
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const adminId = uuidv4();
    const userId1 = uuidv4();
    const userId2 = uuidv4();

    await client.query(`
      INSERT INTO users (id, email, password_hash, role) VALUES
      ($1, 'admin@marking.ru', $2, 'ADMIN'),
      ($3, 'user@marking.ru', $4, 'USER'),
      ($5, 'manager@marking.ru', $4, 'USER')
    `, [adminId, adminPassword, userId1, userPassword, userId2]);

    console.log('✅ Users created (admin@marking.ru / admin123, user@marking.ru / user123)');

    // ---- Create 50 products ----
    const productIds = [];
    const productInserts = [];
    const productValues = [];
    let pIdx = 1;

    for (const [category, names] of Object.entries(PRODUCT_NAMES)) {
      for (const name of names) {
        const pid = uuidv4();
        productIds.push(pid);
        productInserts.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4})`);
        productValues.push(pid, name, category, `Описание: ${name}`, adminId);
        pIdx += 5;
      }
    }

    await client.query(
      `INSERT INTO products (id, name, category, description, created_by) VALUES ${productInserts.join(',')}`,
      productValues
    );
    console.log(`✅ ${productIds.length} products created`);

    // ---- Create 120 codes (mix of statuses) ----
    const codeInserts = [];
    const codeValues = [];
    const usedCodes = new Set();
    let cIdx = 1;
    let codesCreated = 0;

    for (let i = 0; i < 120; i++) {
      let code;
      do { code = generateCode(); } while (usedCodes.has(code));
      usedCodes.add(code);

      const productId = productIds[i % productIds.length];
      const status = i < 60 ? 'valid' : i < 90 ? 'used' : 'invalid';
      const creatorId = i % 3 === 0 ? adminId : userId1;
      const usedAt = status === 'used' ? `NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'` : 'NULL';

      codeInserts.push(`($${cIdx}, $${cIdx+1}, $${cIdx+2}, $${cIdx+3}, $${cIdx+4}, ${usedAt})`);
      codeValues.push(uuidv4(), productId, code, status, creatorId);
      cIdx += 5;
      codesCreated++;
    }

    await client.query(
      `INSERT INTO codes (id, product_id, code, status, created_by, used_at) VALUES ${codeInserts.join(',')}`,
      codeValues
    );
    console.log(`✅ ${codesCreated} codes created`);

    // ---- Create 50+ log entries ----
    const actions = [
      'AUTH_LOGIN', 'AUTH_REGISTER', 'PRODUCT_CREATE', 'CODE_GENERATE', 'CODE_VERIFY',
      'PRODUCT_LIST', 'LOGS_VIEW', 'AUTH_LOGOUT'
    ];

    const logInserts = [];
    const logValues = [];
    let lIdx = 1;

    for (let i = 0; i < 60; i++) {
      const action = actions[i % actions.length];
      const uid = i % 2 === 0 ? adminId : userId1;
      logInserts.push(`($${lIdx}, $${lIdx+1}, $${lIdx+2}, $${lIdx+3})`);
      logValues.push(
        uuidv4(),
        uid,
        action,
        JSON.stringify({ source: 'seed', index: i })
      );
      lIdx += 4;
    }

    await client.query(
      `INSERT INTO logs (id, user_id, action, details) VALUES ${logInserts.join(',')}`,
      logValues
    );
    console.log('✅ 60 log entries created');

    await client.query('COMMIT');
    console.log('\n🎉 Seed completed successfully!');
    console.log('📊 Summary:');
    console.log('   Users: 3 (1 admin, 2 users)');
    console.log(`   Products: ${productIds.length}`);
    console.log(`   Codes: ${codesCreated} (60 valid, 30 used, 30 invalid)`);
    console.log('   Logs: 60');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./supabase');

const PRODUCT_NAMES = {
  'Электроника':       ['Смартфон Samsung Galaxy S24','Ноутбук Lenovo IdeaPad','Планшет Apple iPad 10','Наушники Sony WH-1000XM5','Телевизор LG OLED C3'],
  'Одежда':            ['Куртка зимняя мужская','Платье вечернее женское','Джинсы Levi\'s 501','Футболка хлопковая','Худи спортивное Nike'],
  'Обувь':             ['Кроссовки Nike Air Max 270','Туфли кожаные классические','Сапоги зимние женские','Ботинки мужские Ecco','Кеды Converse All Star'],
  'Продукты питания':  ['Кофе арабика 1кг Lavazza','Чай черный Lipton 100п','Шоколад Lindt 85%','Мед натуральный горный','Паста De Cecco спагетти'],
  'Лекарства':         ['Парацетамол 500мг N20','Ибупрофен 400мг N30','Витамин C 1000мг шипучий','Омега-3 ПНЖК капсулы','Мультивитамины Centrum Adult'],
  'Косметика':         ['Крем Vichy SPF50 50мл','Шампунь Loreal Elseve','Помада MAC Matte Lipstick','Духи Chanel Chance EDP','Сыворотка The Ordinary'],
  'Ювелирные изделия': ['Кольцо золотое с бриллиантом','Серьги серебряные с фианитами','Браслет жёлтое золото 585','Цепочка белое золото 750','Часы Tissot PR 100'],
  'Игрушки':           ['Конструктор LEGO Technic','Кукла Barbie Fashionista','Монополия Россия','Пазл Ravensburger 1000дет.','Вертолёт р/у Syma X5C'],
  'Автозапчасти':      ['Масляный фильтр Bosch','Тормозные колодки Brembo','Аккумулятор Varta Blue 60Ah','Свечи зажигания NGK Iridium','Амортизатор KYB передний'],
  'Бытовая химия':     ['Ariel Liquid 3кг Color','Fairy Platinum 900мл','Finish Quantum 60таб.','Lenor Amethyst 1.8л','Cillit Bang Известь'],
};

// ── Fast batch code generation — no per-code DB round-trips ──
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function makeCode() {
  let code = 'MRK-';
  for (let seg = 0; seg < 4; seg++) {
    for (let c = 0; c < 4; c++) code += CHARS[Math.floor(Math.random() * 36)];
    if (seg < 3) code += '-';
  }
  return code;
}
function makeBatchCodes(n) {
  const set = new Set();
  while (set.size < n) set.add(makeCode());
  return [...set];
}

async function seed() {
  console.log('\n🌱  Seeding «Честный знак» database...\n');

  // ── 1. Users ──────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('admin123', 10);
  const userPwd  = await bcrypt.hash('user123',  10);
  const adminId  = uuidv4();
  const userId1  = uuidv4();
  const userId2  = uuidv4();

  const { error: ue } = await supabase.from('users').upsert([
    { id: adminId, email: 'admin@chestnyznak.ru',    password_hash: adminPwd, role: 'ADMIN' },
    { id: userId1, email: 'user@chestnyznak.ru',     password_hash: userPwd,  role: 'USER'  },
    { id: userId2, email: 'operator@chestnyznak.ru', password_hash: userPwd,  role: 'USER'  },
  ], { onConflict: 'email' });
  if (ue) throw new Error('Users: ' + ue.message);
  console.log('✅  3 users created');

  // ── 2. Products ───────────────────────────────────────────
  const productRows = [];
  const productIds  = [];
  for (const [category, names] of Object.entries(PRODUCT_NAMES)) {
    for (const name of names) {
      const id = uuidv4();
      productIds.push(id);
      productRows.push({ id, name, category, description: `${name} — ${category}`, created_by: adminId });
    }
  }
  const { error: pe } = await supabase.from('products').upsert(productRows, { onConflict: 'id' });
  if (pe) throw new Error('Products: ' + pe.message);
  console.log(`✅  ${productRows.length} products created`);

  // ── 3. Codes (120) — batch, no round-trips ────────────────
  const allCodes = makeBatchCodes(120);
  const codeRows = allCodes.map((code, i) => ({
    id:         uuidv4(),
    product_id: productIds[i % productIds.length],
    code,
    status:     i < 60 ? 'valid' : i < 90 ? 'used' : 'invalid',
    created_by: i % 3 === 0 ? adminId : userId1,
    used_at:    i >= 60 && i < 90
      ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
      : null,
  }));

  for (let i = 0; i < codeRows.length; i += 50) {
    const { error: ce } = await supabase.from('codes').upsert(codeRows.slice(i, i + 50), { onConflict: 'id' });
    if (ce) throw new Error(`Codes[${i}]: ` + ce.message);
  }
  console.log(`✅  ${codeRows.length} codes (60 valid / 30 used / 30 invalid)`);

  // ── 4. Logs (60) ──────────────────────────────────────────
  const actions = ['AUTH_LOGIN','AUTH_REGISTER','PRODUCT_CREATE','CODE_GENERATE','CODE_VERIFY','PRODUCT_LIST','LOGS_VIEW'];
  const logRows = Array.from({ length: 60 }, (_, i) => ({
    id:         uuidv4(),
    user_id:    i % 2 === 0 ? adminId : userId1,
    action:     actions[i % actions.length],
    details:    { source: 'seed', index: i },
    ip_address: `192.168.1.${(i % 50) + 1}`,
  }));
  for (let i = 0; i < logRows.length; i += 50) {
    const { error: le } = await supabase.from('logs').insert(logRows.slice(i, i + 50));
    if (le) throw new Error(`Logs[${i}]: ` + le.message);
  }
  console.log(`✅  ${logRows.length} log entries created`);

  console.log('\n🎉  Seed complete!');
  console.log('────────────────────────────────────────────');
  console.log('  admin@chestnyznak.ru    / admin123  [ADMIN]');
  console.log('  user@chestnyznak.ru     / user123   [USER]');
  console.log('  operator@chestnyznak.ru / user123   [USER]');
  console.log('────────────────────────────────────────────\n');
  process.exit(0);
}

seed().catch(err => { console.error('\n❌  Seed failed:', err.message); process.exit(1); });

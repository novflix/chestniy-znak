const { v4: uuidv4 } = require('uuid');
const codeRepository = require('../repositories/codeRepository');
const productRepository = require('../repositories/productRepository');

// Code format: MRK-XXXX-XXXX-XXXX-XXXX (alphanumeric uppercase)
const CODE_REGEX = /^MRK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

class CodeService {
  /**
   * Generate a cryptographically unique code
   */
  generateUniqueCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomSegment = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    return `MRK-${randomSegment()}-${randomSegment()}-${randomSegment()}-${randomSegment()}`;
  }

  /**
   * Generate one or more codes for a product
   */
  async generate({ productId, count = 1, userId }) {
    // Validate product exists
    const productExists = await productRepository.exists(productId);
    if (!productExists) {
      throw { status: 404, message: 'Товар не найден.' };
    }

    if (count < 1 || count > 100) {
      throw { status: 400, message: 'Количество кодов должно быть от 1 до 100.' };
    }

    // Generate unique codes (retry on collision)
    const codes = [];
    let attempts = 0;
    const maxAttempts = count * 3;

    while (codes.length < count && attempts < maxAttempts) {
      const code = this.generateUniqueCode();
      const exists = await codeRepository.codeExists(code);
      
      if (!exists) {
        codes.push({ productId, code, createdBy: userId });
      }
      attempts++;
    }

    if (codes.length < count) {
      throw { status: 500, message: 'Не удалось сгенерировать уникальные коды.' };
    }

    // Save to DB
    const saved = [];
    for (const c of codes) {
      const record = await codeRepository.create(c);
      saved.push(record);
    }

    return saved;
  }

  /**
   * Verify a marking code and optionally mark it as used
   */
  async verify({ code, markAsUsed = false, userId }) {
    // Validate code format
    if (!CODE_REGEX.test(code)) {
      return {
        valid: false,
        status: 'invalid_format',
        message: 'Неверный формат кода маркировки.',
        code
      };
    }

    // Find code in DB
    const record = await codeRepository.findByCode(code);

    if (!record) {
      return {
        valid: false,
        status: 'not_found',
        message: 'Код маркировки не найден в системе.',
        code
      };
    }

    if (record.status === 'used') {
      return {
        valid: false,
        status: 'used',
        message: 'Код уже был использован.',
        code,
        product: { name: record.product_name, category: record.product_category },
        usedAt: record.used_at
      };
    }

    if (record.status === 'invalid') {
      return {
        valid: false,
        status: 'invalid',
        message: 'Код признан недействительным.',
        code,
        product: { name: record.product_name, category: record.product_category }
      };
    }

    // Code is valid
    if (markAsUsed) {
      await codeRepository.markAsUsed(code, userId);
    }

    return {
      valid: true,
      status: 'valid',
      message: 'Код маркировки действителен.',
      code,
      product: { name: record.product_name, category: record.product_category },
      createdAt: record.created_at
    };
  }

  async getStats() {
    return codeRepository.getStats();
  }

  validateFormat(code) {
    return CODE_REGEX.test(code);
  }
}

module.exports = new CodeService();

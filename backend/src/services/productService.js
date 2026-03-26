const productRepository = require('../repositories/productRepository');

class ProductService {
  async getAll(filters) { return productRepository.findAll(filters); }

  async getById(id) {
    const p = await productRepository.findById(id);
    if (!p) throw { status: 404, message: 'Товар не найден.' };
    return p;
  }

  async create({ name, category, description, userId }) {
    return productRepository.create({ name: name.trim(), category: category.trim(), description: description?.trim(), createdBy: userId });
  }

  async getCategories() { return productRepository.getCategories(); }
  async exists(id)       { return productRepository.exists(id); }
}

module.exports = new ProductService();

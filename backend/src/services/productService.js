const productRepository = require('../repositories/productRepository');

class ProductService {
  async getAll(filters) {
    return productRepository.findAll(filters);
  }

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw { status: 404, message: 'Товар не найден.' };
    }
    return product;
  }

  async create({ name, category, description, userId }) {
    return productRepository.create({
      name: name.trim(),
      category: category.trim(),
      description: description?.trim(),
      createdBy: userId,
    });
  }

  async getCategories() {
    return productRepository.getCategories();
  }

  async exists(id) {
    return productRepository.exists(id);
  }
}

module.exports = new ProductService();

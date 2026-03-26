const { supabase } = require('../config/supabase');

class ProductRepository {
  async findAll({ page = 1, limit = 20, category } = {}) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select(`
        id, name, category, description, created_at,
        users!products_created_by_fkey(email),
        codes(id, status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) throw error;

    // Flatten joined fields
    const products = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      created_at: p.created_at,
      created_by_email: p.users?.email || null,
      code_count: p.codes?.length || 0,
      valid_codes: p.codes?.filter(c => c.status === 'valid').length || 0,
    }));

    return { products, total: count || 0, page, limit };
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, users!products_created_by_fkey(email)')
      .eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data, created_by_email: data.users?.email || null };
  }

  async create({ name, category, description, createdBy }) {
    const { data, error } = await supabase
      .from('products')
      .insert({ name, category, description: description || null, created_by: createdBy })
      .select('*').single();
    if (error) throw error;
    return data;
  }

  async exists(id) {
    const { data, error } = await supabase
      .from('products').select('id').eq('id', id).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async getCategories() {
    const { data, error } = await supabase
      .from('products').select('category');
    if (error) throw error;
    return [...new Set((data || []).map(r => r.category))].sort();
  }
}

module.exports = new ProductRepository();

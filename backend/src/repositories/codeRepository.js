const { supabase } = require('../config/supabase');

class CodeRepository {
  /** Single insert */
  async create({ productId, code, createdBy }) {
    const { data, error } = await supabase
      .from('codes')
      .insert({ product_id: productId, code, status: 'valid', created_by: createdBy })
      .select('*').single();
    if (error) throw error;
    return data;
  }

  /**
   * Bulk insert — all rows in ONE Supabase request.
   * Much faster than N sequential inserts.
   */
  async createMany(rows) {
    if (!rows.length) return [];
    const { data, error } = await supabase
      .from('codes')
      .insert(rows.map(r => ({
        product_id: r.productId,
        code: r.code,
        status: 'valid',
        created_by: r.createdBy,
      })))
      .select('*');
    if (error) throw error;
    return data;
  }

  /**
   * O(1) lookup via unique index on code column.
   * Joins product name for the verify response.
   */
  async findByCode(code) {
    const { data, error } = await supabase
      .from('codes')
      .select('*, products(name, category)')
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      product_name:     data.products?.name     || null,
      product_category: data.products?.category || null,
    };
  }

  async markAsUsed(code) {
    const { data, error } = await supabase
      .from('codes')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('code', code).eq('status', 'valid')
      .select('*').maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Bulk check which codes from a Set already exist — one round-trip */
  async filterExisting(codeSet) {
    const codes = [...codeSet];
    if (!codes.length) return new Set();
    const { data, error } = await supabase
      .from('codes').select('code').in('code', codes);
    if (error) throw error;
    return new Set((data || []).map(r => r.code));
  }

  async getStats() {
    const { data, error } = await supabase
      .from('codes')
      .select('status');
    if (error) throw error;
    const rows = data || [];
    return {
      total:   String(rows.length),
      valid:   String(rows.filter(r => r.status === 'valid').length),
      used:    String(rows.filter(r => r.status === 'used').length),
      invalid: String(rows.filter(r => r.status === 'invalid').length),
    };
  }
}

module.exports = new CodeRepository();

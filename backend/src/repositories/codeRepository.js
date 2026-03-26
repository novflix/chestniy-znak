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

  /**
   * FIX: считаем на стороне Supabase через { count: 'exact', head: true }.
   * Supabase по умолчанию возвращает максимум 1000 строк — если считать
   * длину массива в JS, статистика обрезается на 1000 даже при 10 000+ кодах.
   * head: true = только COUNT, данные не передаются — быстро и точно.
   */
  async getStats() {
    const [totalRes, validRes, usedRes, invalidRes] = await Promise.all([
      supabase.from('codes').select('*', { count: 'exact', head: true }),
      supabase.from('codes').select('*', { count: 'exact', head: true }).eq('status', 'valid'),
      supabase.from('codes').select('*', { count: 'exact', head: true }).eq('status', 'used'),
      supabase.from('codes').select('*', { count: 'exact', head: true }).eq('status', 'invalid'),
    ]);

    for (const res of [totalRes, validRes, usedRes, invalidRes]) {
      if (res.error) throw res.error;
    }

    return {
      total:   String(totalRes.count   ?? 0),
      valid:   String(validRes.count   ?? 0),
      used:    String(usedRes.count    ?? 0),
      invalid: String(invalidRes.count ?? 0),
    };
  }
}

module.exports = new CodeRepository();
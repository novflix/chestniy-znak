const { supabase } = require('../config/supabase');

class LogRepository {
  async findAll({ page = 1, limit = 50, action, userId } = {}) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('logs')
      .select('id, action, details, ip_address, timestamp, users(email, role)', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) query = query.eq('action', action);
    if (userId) query = query.eq('user_id', userId);

    const { data, error, count } = await query;
    if (error) throw error;

    const logs = (data || []).map(l => ({
      id:          l.id,
      action:      l.action,
      details:     l.details,
      ip_address:  l.ip_address,
      timestamp:   l.timestamp,
      user_email:  l.users?.email || null,
      user_role:   l.users?.role  || null,
    }));

    return { logs, total: count || 0, page, limit };
  }

  async create({ userId, action, details, ipAddress }) {
    const { error } = await supabase.from('logs').insert({
      user_id:    userId    || null,
      action,
      details:    details   || {},
      ip_address: ipAddress || null,
    });
    if (error) console.error('Log insert error:', error.message); // non-fatal
  }
}

module.exports = new LogRepository();

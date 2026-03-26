const { supabase } = require('../config/supabase');

class UserRepository {
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('users').select('id,email,role,created_at').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create({ email, passwordHash, role = 'USER' }) {
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash, role })
      .select('id,email,role,created_at')
      .single();
    if (error) throw error;
    return data;
  }

  async emailExists(email) {
    const { data, error } = await supabase
      .from('users').select('id').eq('email', email).maybeSingle();
    if (error) throw error;
    return !!data;
  }
}

module.exports = new UserRepository();

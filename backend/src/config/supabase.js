const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

/**
 * Server-side admin client — uses the secret key so RLS is bypassed.
 * Never expose this client to the browser.
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Thin helper: throws a normalised error when Supabase returns one.
 * Usage: const rows = await query(supabase.from('users').select('*'));
 */
async function query(promise) {
  const { data, error, count } = await promise;
  if (error) {
    const err = new Error(error.message);
    err.code = error.code;
    err.details = error.details;
    throw err;
  }
  return { data, count };
}

module.exports = { supabase, query };

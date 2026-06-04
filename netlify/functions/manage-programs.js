/**
 * POST /.netlify/functions/manage-programs
 * Create a new academic program in Supabase.
 *
 * The `program_id` column is GENERATED ALWAYS AS IDENTITY — never pass it.
 */

const { getSupabase } = require('./_shared/supabaseClient');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const json = (s, b) => ({ statusCode: s, headers: CORS, body: JSON.stringify(b) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return json(405, { error: 'Method not allowed' });

  try {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON body' }); }

    const program_name = (body.program_name || '').trim();
    const faculty      = (body.faculty || '').trim();
    const total_credits = Number.isFinite(parseInt(body.total_credits, 10))
      ? parseInt(body.total_credits, 10)
      : 120;

    if (!program_name || !faculty) {
      return json(400, { error: 'program_name and faculty are required' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('program')
      .insert({ program_name, faculty, total_credits })
      .select('program_id')
      .single();

    if (error) {
      console.error('Insert program error:', error);
      return json(500, { error: 'Failed to create program', message: error.message });
    }

    return json(201, {
      success: true,
      program_id: String(data.program_id),
      message: 'Program created successfully'
    });
  } catch (error) {
    console.error('manage-programs fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

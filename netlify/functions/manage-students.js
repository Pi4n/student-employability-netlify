/**
 * POST /.netlify/functions/manage-students
 * Create a new student in Supabase.
 *
 * `student_id` is GENERATED ALWAYS AS IDENTITY — never pass it.
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

    const full_name = (body.full_name || '').trim();
    const matric_no = (body.matric_no || '').trim();
    const email     = (body.email || '').trim();
    const program_id = parseInt(body.program_id, 10);

    if (!full_name || !matric_no || !email || !Number.isFinite(program_id)) {
      return json(400, { error: 'full_name, matric_no, email and program_id are required' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('student')
      .insert({ full_name, matric_no, email, program_id })
      .select('student_id')
      .single();

    if (error) {
      console.error('Insert student error:', error);
      if (error.code === '23505') {
        return json(409, { error: 'Student with this matric number or email already exists' });
      }
      if (error.code === '23503') {
        return json(400, { error: 'Invalid program_id (program does not exist)' });
      }
      return json(500, { error: 'Failed to create student', message: error.message });
    }

    return json(201, {
      success: true,
      student_id: String(data.student_id),
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('manage-students fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

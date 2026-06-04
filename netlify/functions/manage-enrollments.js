/**
 * POST /.netlify/functions/manage-enrollments
 * Create or delete a student enrollment in Supabase.
 */

const { getSupabase } = require('./_shared/supabaseClient');
const { transformStatusToOracle } = require('./_shared/transformers');

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

    const { action } = body;
    const supabase = getSupabase();

    if (action === 'delete') {
      const enrollment_id = parseInt(body.enrollment_id, 10);
      if (!Number.isFinite(enrollment_id)) {
        return json(400, { error: 'enrollment_id is required for delete' });
      }
      const { error } = await supabase.from('enrollment').delete().eq('enrollment_id', enrollment_id);
      if (error) {
        console.error('Delete enrollment error:', error);
        return json(500, { error: 'Failed to delete enrollment', message: error.message });
      }
      return json(200, { success: true, message: 'Enrollment deleted successfully' });
    }

    const student_id = parseInt(body.student_id, 10);
    const course_id  = parseInt(body.course_id, 10);
    const semester   = (body.semester || '').trim();
    const status     = transformStatusToOracle(body.status || 'In Progress');
    const grade      = body.grade ? String(body.grade) : null;

    if (!Number.isFinite(student_id) || !Number.isFinite(course_id) || !semester) {
      return json(400, { error: 'student_id, course_id and semester are required' });
    }

    const { data, error } = await supabase
      .from('enrollment')
      .insert({ student_id, course_id, semester, status, grade })
      .select('enrollment_id')
      .single();

    if (error) {
      console.error('Insert enrollment error:', error);
      if (error.code === '23505') return json(409, { error: 'Student already enrolled in this course/semester' });
      if (error.code === '23503') return json(400, { error: 'Invalid student_id or course_id' });
      return json(500, { error: 'Failed to create enrollment', message: error.message });
    }

    return json(201, {
      success: true,
      enrollment_id: String(data.enrollment_id),
      message: 'Enrollment created successfully'
    });
  } catch (error) {
    console.error('manage-enrollments fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

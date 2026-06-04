/**
 * POST /.netlify/functions/manage-courses
 * Create or update a course in Supabase.
 */

const { getSupabase } = require('./_shared/supabaseClient');
const { transformCourseTypeToDb } = require('./_shared/transformers');

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

    const course_code = (body.course_code || '').trim();
    const course_name = (body.course_name || '').trim();
    const program_id  = parseInt(body.program_id, 10);
    const credit_hours = Number.isFinite(parseInt(body.credit_hours, 10))
      ? parseInt(body.credit_hours, 10) : 3;
    const course_type = transformCourseTypeToDb(body.course_type || 'Core');
    const courseIdRaw = body.course_id ? parseInt(body.course_id, 10) : null;

    if (!course_code || !course_name || !Number.isFinite(program_id)) {
      return json(400, { error: 'course_code, course_name and program_id are required' });
    }

    const supabase = getSupabase();

    if (courseIdRaw) {
      const { error } = await supabase
        .from('course')
        .update({ course_code, course_name, course_type, credit_hours, program_id })
        .eq('course_id', courseIdRaw);

      if (error) {
        console.error('Update course error:', error);
        return json(500, { error: 'Failed to update course', message: error.message });
      }
      return json(200, { success: true, course_id: String(courseIdRaw), message: 'Course updated successfully' });
    }

    const { data, error } = await supabase
      .from('course')
      .insert({ course_code, course_name, course_type, credit_hours, program_id })
      .select('course_id')
      .single();

    if (error) {
      console.error('Insert course error:', error);
      if (error.code === '23505') return json(409, { error: 'Course code already exists' });
      if (error.code === '23503') return json(400, { error: 'Invalid program_id (program does not exist)' });
      return json(500, { error: 'Failed to create course', message: error.message });
    }

    return json(201, {
      success: true,
      course_id: String(data.course_id),
      message: 'Course created successfully'
    });
  } catch (error) {
    console.error('manage-courses fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

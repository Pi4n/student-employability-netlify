/**
 * POST /.netlify/functions/manage-learning-outcomes
 * Create, update, or delete a learning outcome in Supabase.
 *
 * Body shapes:
 *   create: { lo_code, description, domain?, course_id? }
 *   update: { lo_id, lo_code, description, domain?, course_id? }
 *   delete: { action:'delete', lo_id }
 */

const { getSupabase } = require('./_shared/supabaseClient');
const { transformLODomainToDb } = require('./_shared/transformers');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const json = (s, b) => ({ statusCode: s, headers: CORS, body: JSON.stringify(b) });

/** Ensure a default ‘General Studies’ program + ‘GEN000’ course exist. */
async function ensureDefaultCourse(supabase) {
  // program
  let { data: prog } = await supabase
    .from('program').select('program_id').eq('program_name', 'General Studies').limit(1).maybeSingle();

  if (!prog) {
    const ins = await supabase
      .from('program').insert({ program_name: 'General Studies', faculty: 'General', total_credits: 120 })
      .select('program_id').single();
    if (ins.error) throw ins.error;
    prog = ins.data;
  }

  // course
  let { data: course } = await supabase
    .from('course').select('course_id').eq('course_code', 'GEN000').limit(1).maybeSingle();

  if (!course) {
    const ins = await supabase
      .from('course').insert({
        course_code: 'GEN000',
        course_name: 'General Learning Outcomes',
        credit_hours: 0,
        course_type: 'Academic',
        program_id: prog.program_id
      }).select('course_id').single();
    if (ins.error) throw ins.error;
    course = ins.data;
  }

  return course.course_id;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return json(405, { error: 'Method not allowed' });

  try {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return json(400, { error: 'Invalid JSON body' }); }

    const { action } = body;
    const supabase = getSupabase();

    // ── DELETE ────────────────────────────────────────────────
    if (action === 'delete') {
      const lo_id = parseInt(body.lo_id, 10);
      if (!Number.isFinite(lo_id)) return json(400, { error: 'lo_id is required for delete' });

      const { error } = await supabase.from('learning_outcome').delete().eq('lo_id', lo_id);
      if (error) {
        console.error('Delete LO error:', error);
        return json(500, { error: 'Failed to delete learning outcome', message: error.message });
      }
      return json(200, { success: true, message: 'Learning outcome deleted successfully' });
    }

    const lo_code     = (body.lo_code || '').trim();
    const description = (body.description || '').trim();
    if (!lo_code || !description) {
      return json(400, { error: 'lo_code and description are required' });
    }

    const domain = transformLODomainToDb(body.domain || 'Academic');
    const course_id = body.course_id
      ? parseInt(body.course_id, 10)
      : await ensureDefaultCourse(supabase);

    // ── UPDATE ────────────────────────────────────────────────
    if (body.lo_id) {
      const lo_id = parseInt(body.lo_id, 10);
      const { error } = await supabase
        .from('learning_outcome')
        .update({ lo_code, description, domain, course_id })
        .eq('lo_id', lo_id);

      if (error) {
        console.error('Update LO error:', error);
        return json(500, { error: 'Failed to update learning outcome', message: error.message });
      }
      return json(200, { success: true, lo_id: String(lo_id), message: 'Learning outcome updated successfully' });
    }

    // ── CREATE ────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('learning_outcome')
      .insert({ lo_code, description, domain, course_id })
      .select('lo_id')
      .single();

    if (error) {
      console.error('Insert LO error:', error);
      if (error.code === '23505') return json(409, { error: 'lo_code already exists' });
      return json(500, { error: 'Failed to create learning outcome', message: error.message });
    }

    return json(201, {
      success: true,
      lo_id: String(data.lo_id),
      message: 'Learning outcome created successfully'
    });
  } catch (error) {
    console.error('manage-learning-outcomes fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

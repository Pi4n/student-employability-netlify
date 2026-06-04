/**
 * POST /.netlify/functions/manage-cocurriculum
 * Create / update / delete activities, skill mappings, and student participation
 * for the co-curriculum module — all in Supabase.
 *
 * Body shape: { type: 'activity' | 'skill-mapping' | 'participation', action?, ... }
 */

const { getSupabase } = require('./_shared/supabaseClient');
const {
  transformCreditBearingToOracle,
  transformKnowledgeTypeToOracle,
  transformMappingStrengthToOracle,
  transformAchievementToOracle
} = require('./_shared/transformers');

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

    const { type, action } = body;
    const supabase = getSupabase();

    // ── Activity ────────────────────────────────────────────────
    if (type === 'activity') {
      const activity_name = (body.activity_name || '').trim();
      const organizer     = (body.organizer || '').trim();
      const category      = (body.category || '').trim();
      const credit_hours  = Number.isFinite(parseInt(body.credit_hours, 10))
        ? parseInt(body.credit_hours, 10) : 0;
      // is_credit_bearing is a PostgreSQL BOOLEAN
      const is_credit_bearing = transformCreditBearingToOracle(body.is_credit_bearing) === 1;

      if (!activity_name || !organizer || !category) {
        return json(400, { error: 'activity_name, organizer and category are required' });
      }

      if (body.cocurr_id) {
        const cocurr_id = parseInt(body.cocurr_id, 10);
        const { error } = await supabase
          .from('co_curriculum')
          .update({ activity_name, organizer, category, is_credit_bearing, credit_hours })
          .eq('cocurr_id', cocurr_id);

        if (error) {
          console.error('Update activity error:', error);
          return json(500, { error: 'Failed to update activity', message: error.message });
        }
        return json(200, { success: true, cocurr_id: String(cocurr_id) });
      }

      const { data, error } = await supabase
        .from('co_curriculum')
        .insert({ activity_name, organizer, category, is_credit_bearing, credit_hours })
        .select('cocurr_id')
        .single();

      if (error) {
        console.error('Insert activity error:', error);
        return json(500, { error: 'Failed to create activity', message: error.message });
      }
      return json(201, { success: true, cocurr_id: String(data.cocurr_id) });
    }

    // ── Skill Mapping ───────────────────────────────────────────
    if (type === 'skill-mapping') {
      if (action === 'delete') {
        const mapping_id = parseInt(body.mapping_id, 10);
        if (!Number.isFinite(mapping_id)) return json(400, { error: 'mapping_id required' });

        const { error } = await supabase.from('cocurr_skill_mapping').delete().eq('mapping_id', mapping_id);
        if (error) {
          console.error('Delete cocurr-mapping error:', error);
          return json(500, { error: 'Failed to delete mapping', message: error.message });
        }
        return json(200, { success: true });
      }

      const cocurr_id = parseInt(body.cocurr_id, 10);
      const skill_id  = parseInt(body.skill_id, 10);
      if (!Number.isFinite(cocurr_id) || !Number.isFinite(skill_id)) {
        return json(400, { error: 'cocurr_id and skill_id are required' });
      }
      const knowledge_type   = transformKnowledgeTypeToOracle(body.knowledge_type);
      const mapping_strength = transformMappingStrengthToOracle(body.mapping_strength || 0.6);

      const { data, error } = await supabase
        .from('cocurr_skill_mapping')
        .insert({ cocurr_id, skill_id, knowledge_type, mapping_strength })
        .select('mapping_id')
        .single();

      if (error) {
        console.error('Insert cocurr-mapping error:', error);
        if (error.code === '23505') return json(409, { error: 'Mapping already exists' });
        if (error.code === '23503') return json(400, { error: 'Invalid cocurr_id or skill_id' });
        return json(500, { error: 'Failed to create mapping', message: error.message });
      }
      return json(201, { success: true, mapping_id: String(data.mapping_id) });
    }

    // ── Student Participation ───────────────────────────────────
    if (type === 'participation') {
      if (action === 'delete') {
        const record_id = parseInt(body.record_id, 10);
        if (!Number.isFinite(record_id)) return json(400, { error: 'record_id required' });

        const { error } = await supabase.from('student_cocurriculum').delete().eq('record_id', record_id);
        if (error) {
          console.error('Delete participation error:', error);
          return json(500, { error: 'Failed to delete participation', message: error.message });
        }
        return json(200, { success: true });
      }

      const student_id = parseInt(body.student_id, 10);
      const cocurr_id  = parseInt(body.cocurr_id, 10);
      const semester   = (body.semester || '').trim();
      const role       = (body.role || '').trim();
      const achievement = transformAchievementToOracle(body.achievement ?? 0.7);

      if (!Number.isFinite(student_id) || !Number.isFinite(cocurr_id) || !semester || !role) {
        return json(400, { error: 'student_id, cocurr_id, semester and role are required' });
      }

      const { data, error } = await supabase
        .from('student_cocurriculum')
        .insert({ student_id, cocurr_id, semester, role, achievement })
        .select('record_id')
        .single();

      if (error) {
        console.error('Insert participation error:', error);
        if (error.code === '23503') return json(400, { error: 'Invalid student_id or cocurr_id' });
        return json(500, { error: 'Failed to create participation', message: error.message });
      }
      return json(201, { success: true, record_id: String(data.record_id) });
    }

    return json(400, { error: 'Invalid request type (expected activity | skill-mapping | participation)' });
  } catch (error) {
    console.error('manage-cocurriculum fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

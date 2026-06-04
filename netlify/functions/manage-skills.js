/**
 * POST /.netlify/functions/manage-skills
 * Create an employability skill in Supabase (with Option B type translation).
 */

const { getSupabase } = require('./_shared/supabaseClient');
const { transformSkillTypeToOracle } = require('./_shared/transformers');

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

    const skill_name  = (body.skill_name || '').trim();
    const skill_type  = transformSkillTypeToOracle(body.skill_type);
    const description = body.description ? String(body.description) : null;

    if (!skill_name || !body.skill_type) {
      return json(400, { error: 'skill_name and skill_type are required' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('employability_skill')
      .insert({ skill_name, skill_type, description })
      .select('skill_id')
      .single();

    if (error) {
      console.error('Insert skill error:', error);
      return json(500, { error: 'Failed to create skill', message: error.message });
    }

    return json(201, {
      success: true,
      skill_id: String(data.skill_id),
      message: 'Skill created successfully'
    });
  } catch (error) {
    console.error('manage-skills fatal:', error);
    return json(500, { error: 'Server error', message: error.message });
  }
};

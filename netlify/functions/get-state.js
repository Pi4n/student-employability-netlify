/**
 * GET /.netlify/functions/get-state
 * Returns the entire application state from Supabase in one payload.
 */

const { getSupabase } = require('./_shared/supabaseClient');
const {
  transformCourseTypeFromDb,
  transformStatusFromDb,
  transformKnowledgeTypeFromDb,
  transformSkillTypeFromDb,
  transformMappingStrengthFromDb,
  transformAchievementFromDb,
  transformLODomainFromDb,
  transformCreditBearingFromDb
} = require('./_shared/transformers');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const ok  = (b) => ({ statusCode: 200, headers: CORS, body: JSON.stringify(b) });
const bad = (s, m) => ({ statusCode: s, headers: CORS, body: JSON.stringify({ error: m }) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET')    return bad(405, 'Method not allowed');

  try {
    const supabase = getSupabase();

    // Run all reads in parallel
    const [
      programs, students, courses, learningOutcomes, skills,
      loSkillMappings, coCurriculum, coCurrSkillMappings, enrollments, studentCoCurr
    ] = await Promise.all([
      supabase.from('program').select('*').order('program_id'),
      supabase.from('student').select('*').order('student_id'),
      supabase.from('course').select('*').order('course_id'),
      supabase.from('learning_outcome').select('*').order('lo_id'),
      supabase.from('employability_skill').select('*').order('skill_id'),
      supabase.from('skill_mapping').select('*').order('mapping_id'),
      supabase.from('co_curriculum').select('*').order('cocurr_id'),
      supabase.from('cocurr_skill_mapping').select('*').order('mapping_id'),
      supabase.from('enrollment').select('*').order('enrollment_id'),
      supabase.from('student_cocurriculum').select('*').order('record_id')
    ]);

    // Surface the first error if any
    const firstError = [
      programs, students, courses, learningOutcomes, skills,
      loSkillMappings, coCurriculum, coCurrSkillMappings, enrollments, studentCoCurr
    ].find(r => r.error);
    if (firstError) {
      console.error('Supabase read error:', firstError.error);
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'DB read failed', message: firstError.error.message }) };
    }

    const state = {
      meta: { version: 1, fetchedAt: new Date().toISOString() },

      programs: (programs.data || []).map(r => ({
        program_id: String(r.program_id),
        program_name: r.program_name,
        faculty: r.faculty,
        total_credits: r.total_credits
      })),

      students: (students.data || []).map(r => ({
        student_id: String(r.student_id),
        matric_no: r.matric_no,
        full_name: r.full_name,
        email: r.email,
        program_id: String(r.program_id)
      })),

      courses: (courses.data || []).map(r => ({
        course_id: String(r.course_id),
        course_code: r.course_code,
        course_name: r.course_name,
        course_type: transformCourseTypeFromDb(r.course_type),
        credit_hours: r.credit_hours,
        program_id: String(r.program_id)
      })),

      learningOutcomes: (learningOutcomes.data || []).map(r => ({
        lo_id: String(r.lo_id),
        lo_code: r.lo_code,
        description: r.description,
        domain: transformLODomainFromDb(r.domain),
        course_id: String(r.course_id)
      })),

      employabilitySkills: (skills.data || []).map(r => ({
        skill_id: String(r.skill_id),
        skill_name: r.skill_name,
        skill_type: transformSkillTypeFromDb(r.skill_type),
        description: r.description || ''
      })),

      loSkillMappings: (loSkillMappings.data || []).map(r => ({
        mapping_id: String(r.mapping_id),
        lo_id: String(r.lo_id),
        skill_id: String(r.skill_id),
        knowledge_type: transformKnowledgeTypeFromDb(r.knowledge_type),
        mapping_strength: transformMappingStrengthFromDb(r.mapping_strength)
      })),

      coCurriculum: (coCurriculum.data || []).map(r => ({
        cocurr_id: String(r.cocurr_id),
        activity_name: r.activity_name,
        organizer: r.organizer,
        category: r.category,
        is_credit_bearing: transformCreditBearingFromDb(r.is_credit_bearing),
        credit_hours: r.credit_hours
      })),

      coCurrSkillMappings: (coCurrSkillMappings.data || []).map(r => ({
        mapping_id: String(r.mapping_id),
        cocurr_id: String(r.cocurr_id),
        skill_id: String(r.skill_id),
        knowledge_type: transformKnowledgeTypeFromDb(r.knowledge_type),
        mapping_strength: transformMappingStrengthFromDb(r.mapping_strength)
      })),

      enrollments: (enrollments.data || []).map(r => ({
        enrollment_id: String(r.enrollment_id),
        student_id: String(r.student_id),
        course_id: String(r.course_id),
        semester: r.semester,
        status: transformStatusFromDb(r.status),
        grade: r.grade || ''
      })),

      studentCoCurriculum: (studentCoCurr.data || []).map(r => ({
        record_id: String(r.record_id),
        student_id: String(r.student_id),
        cocurr_id: String(r.cocurr_id),
        semester: r.semester,
        role: r.role || '',
        achievement: transformAchievementFromDb(r.achievement)
      }))
    };

    return ok(state);
  } catch (error) {
    console.error('get-state fatal:', error);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Failed to fetch data', message: error.message }) };
  }
};

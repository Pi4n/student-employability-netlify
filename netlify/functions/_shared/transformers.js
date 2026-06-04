/**
 * Data Transformation Layer
 * Converts between frontend display format and the Supabase/PostgreSQL
 * column values used by the database.
 *
 * Convention:
 *   *ToDb(...)   – frontend value -> Supabase column value
 *   *FromDb(...) – Supabase column value -> frontend value
 */

/**
 * Course type
 * Frontend: 'Core', 'Elective'
 * DB:       'Academic', 'Technical', 'Elective'
 */
function transformCourseTypeToDb(frontendType) {
  const mapping = {
    'Core': 'Academic',
    'Elective': 'Elective',
    'Academic': 'Academic',
    'Technical': 'Technical'
  };
  return mapping[frontendType] || 'Academic';
}

function transformCourseTypeFromDb(dbType) {
  const mapping = {
    'Academic': 'Core',
    'Technical': 'Core',
    'Elective': 'Elective'
  };
  return mapping[dbType] || 'Core';
}

/**
 * Enrollment status
 * Frontend: 'In Progress', 'Completed'
 * DB:       'Active', 'Completed', 'Withdrawn'
 */
function transformStatusToDb(frontendStatus) {
  const mapping = {
    'In Progress': 'Active',
    'Completed': 'Completed',
    'Active': 'Active',
    'Withdrawn': 'Withdrawn'
  };
  return mapping[frontendStatus] || 'Active';
}

function transformStatusFromDb(dbStatus) {
  const mapping = {
    'Active': 'In Progress',
    'Completed': 'Completed',
    'Withdrawn': 'Withdrawn'
  };
  return mapping[dbStatus] || 'In Progress';
}

/**
 * Knowledge type
 * Frontend: 'Hard', 'Soft', 'Professional'
 * DB:       'Academic Knowledge', 'Technical Skills', 'Marketability Values'
 */
function transformKnowledgeTypeToDb(frontendType) {
  const mapping = {
    'Hard': 'Academic Knowledge',
    'Soft': 'Technical Skills',
    'Professional': 'Marketability Values',
    'Academic Knowledge': 'Academic Knowledge',
    'Technical Skills': 'Technical Skills',
    'Marketability Values': 'Marketability Values'
  };
  return mapping[frontendType] || 'Academic Knowledge';
}

function transformKnowledgeTypeFromDb(dbType) {
  const mapping = {
    'Academic Knowledge': 'Hard',
    'Technical Skills': 'Soft',
    'Marketability Values': 'Professional'
  };
  return mapping[dbType] || 'Hard';
}

/**
 * Skill type
 * Frontend: 'Cognitive', 'Soft Skill', 'Professional'
 * DB:       'Academic Knowledge', 'Technical Skills', 'Marketability Values'
 */
function transformSkillTypeToDb(frontendType) {
  const mapping = {
    'Cognitive': 'Academic Knowledge',
    'Soft Skill': 'Technical Skills',
    'Professional': 'Marketability Values',
    'Academic Knowledge': 'Academic Knowledge',
    'Technical Skills': 'Technical Skills',
    'Marketability Values': 'Marketability Values'
  };
  return mapping[frontendType] || 'Academic Knowledge';
}

function transformSkillTypeFromDb(dbType) {
  const mapping = {
    'Academic Knowledge': 'Cognitive',
    'Technical Skills': 'Soft Skill',
    'Marketability Values': 'Professional'
  };
  return mapping[dbType] || 'Cognitive';
}

/**
 * Mapping strength
 * Frontend: 0.0-1.0 (number)
 * DB:       'Low', 'Medium', 'High' (string)
 */
function transformMappingStrengthToDb(frontendStrength) {
  const num = parseFloat(frontendStrength);
  if (isNaN(num)) {
    return ['Low', 'Medium', 'High'].includes(frontendStrength) ? frontendStrength : 'Medium';
  }
  if (num < 0.4) return 'Low';
  if (num < 0.7) return 'Medium';
  return 'High';
}

function transformMappingStrengthFromDb(dbStrength) {
  const mapping = {
    'Low': 0.3,
    'Medium': 0.6,
    'High': 0.9
  };
  return mapping[dbStrength] || 0.6;
}

/**
 * Achievement value
 * Frontend: 0.0-1.0 (number)
 * DB:       text/varchar (string)
 */
function transformAchievementToDb(frontendAchievement) {
  if (typeof frontendAchievement === 'number') {
    return frontendAchievement.toString();
  }
  return frontendAchievement || '0';
}

function transformAchievementFromDb(dbAchievement) {
  const num = parseFloat(dbAchievement);
  return isNaN(num) ? 0 : num;
}

/**
 * Learning-outcome domain
 * Frontend: 'Academic', 'Co-curricular'
 * DB:       'Knowledge', 'Skills', 'Values'
 */
function transformLODomainToDb(frontendDomain) {
  const mapping = {
    'Academic': 'Knowledge',
    'Co-curricular': 'Skills',
    'Knowledge': 'Knowledge',
    'Skills': 'Skills',
    'Values': 'Values'
  };
  return mapping[frontendDomain] || 'Knowledge';
}

function transformLODomainFromDb(dbDomain) {
  const mapping = {
    'Knowledge': 'Academic',
    'Skills': 'Co-curricular',
    'Values': 'Co-curricular'
  };
  return mapping[dbDomain] || 'Academic';
}

/**
 * Credit-bearing flag
 * Frontend: true/false (boolean)
 * DB:       1/0 (smallint)
 */
function transformCreditBearingToDb(frontendValue) {
  if (typeof frontendValue === 'boolean') {
    return frontendValue ? 1 : 0;
  }
  if (frontendValue === 'true') return 1;
  if (frontendValue === 'false') return 0;
  return frontendValue ? 1 : 0;
}

function transformCreditBearingFromDb(dbValue) {
  return dbValue === 1 || dbValue === '1' || dbValue === true;
}

module.exports = {
  transformCourseTypeToDb,
  transformCourseTypeFromDb,
  transformStatusToDb,
  transformStatusFromDb,
  transformKnowledgeTypeToDb,
  transformKnowledgeTypeFromDb,
  transformSkillTypeToDb,
  transformSkillTypeFromDb,
  transformMappingStrengthToDb,
  transformMappingStrengthFromDb,
  transformAchievementToDb,
  transformAchievementFromDb,
  transformLODomainToDb,
  transformLODomainFromDb,
  transformCreditBearingToDb,
  transformCreditBearingFromDb
};

function normalizeValue(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
}

function countBy(participants, field, fallback) {
  return participants.reduce((result, participant) => {
    const key = normalizeValue(participant[field], fallback);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function toStats(counts, total) {
  return Object.keys(counts)
    .map(name => ({
      name,
      count: counts[name],
      percent: total > 0 ? Math.round((counts[name] / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

function buildRegistrationStats(participants = []) {
  const validParticipants = Array.isArray(participants) ? participants : [];
  const total = validParticipants.length;

  return {
    total,
    departmentStats: toStats(countBy(validParticipants, 'department', '未填写部门'), total),
    genderStats: toStats(countBy(validParticipants, 'gender', '未填写性别'), total)
  };
}

function shuffle(items, random = Math.random) {
  const result = items.slice();

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
}

function getDepartmentEntries(participants) {
  const departments = participants.reduce((result, participant) => {
    const name = normalizeValue(participant.department, '未填写部门');
    if (!result[name]) {
      result[name] = {
        name,
        participantCount: 0,
        participants: []
      };
    }

    result[name].participantCount += 1;
    result[name].participants.push(participant);
    return result;
  }, {});

  return Object.keys(departments)
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .map(name => departments[name]);
}

function drawDepartmentMatches(participants = [], options = {}) {
  const validParticipants = Array.isArray(participants) ? participants : [];
  const departments = shuffle(getDepartmentEntries(validParticipants), options.random);
  const matches = [];

  for (let index = 0; index < departments.length; index += 2) {
    const departmentA = departments[index];
    const departmentB = departments[index + 1] || null;

    matches.push({
      round: matches.length + 1,
      departmentA,
      departmentB,
      status: departmentB ? 'matched' : 'bye'
    });
  }

  return matches;
}

function parseGroups(groupsText) {
  if (!groupsText || typeof groupsText !== 'string') {
    return [];
  }

  return groupsText
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
}

function drawGroupMatches(participants = [], groupsText = '', options = {}) {
  const validParticipants = Array.isArray(participants) ? participants : [];
  const groupNames = parseGroups(groupsText);

  if (groupNames.length === 0) {
    return { groups: [], error: '请先设置分组名称' };
  }

  const shuffledParticipants = shuffle(validParticipants, options.random);
  const groups = groupNames.map(name => ({
    name,
    participants: []
  }));

  shuffledParticipants.forEach((participant, index) => {
    const groupIndex = index % groupNames.length;
    groups[groupIndex].participants.push(participant);
  });

  return { groups, error: null };
}

function generateGroupBattles(groups = [], options = {}) {
  const validGroups = Array.isArray(groups) ? groups : [];

  if (validGroups.length < 2) {
    return { battles: [], error: '至少需要2个分组才能生成对战' };
  }

  const shuffledGroups = shuffle(validGroups, options.random);
  const battles = [];

  for (let index = 0; index < shuffledGroups.length; index += 2) {
    const groupA = shuffledGroups[index];
    const groupB = shuffledGroups[index + 1] || null;

    battles.push({
      round: battles.length + 1,
      groupA: {
        name: groupA.name,
        participantCount: groupA.participants.length
      },
      groupB: groupB ? {
        name: groupB.name,
        participantCount: groupB.participants.length
      } : null,
      status: groupB ? 'matched' : 'bye'
    });
  }

  return { battles, error: null };
}

function generateDepartmentBattles(participants = [], options = {}) {
  const validParticipants = Array.isArray(participants) ? participants : [];
  const departments = getDepartmentEntries(validParticipants);

  if (departments.length < 2) {
    return { battles: [], error: '至少需要2个部门才能生成对战' };
  }

  const shuffledDepartments = shuffle(departments, options.random);
  const battles = [];

  for (let index = 0; index < shuffledDepartments.length; index += 2) {
    const departmentA = shuffledDepartments[index];
    const departmentB = shuffledDepartments[index + 1] || null;

    battles.push({
      round: battles.length + 1,
      departmentA: {
        name: departmentA.name,
        participantCount: departmentA.participantCount
      },
      departmentB: departmentB ? {
        name: departmentB.name,
        participantCount: departmentB.participantCount
      } : null,
      status: departmentB ? 'matched' : 'bye'
    });
  }

  return { battles, error: null };
}

module.exports = {
  buildRegistrationStats,
  drawDepartmentMatches,
  drawGroupMatches,
  generateGroupBattles,
  generateDepartmentBattles
};

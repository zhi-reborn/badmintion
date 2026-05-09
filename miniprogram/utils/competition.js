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

module.exports = {
  buildRegistrationStats,
  drawDepartmentMatches
};

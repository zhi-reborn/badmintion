function normalizeDepartment(value) {
  const text = String(value || '').trim();
  return text || '未填写团体名称';
}

function toNumber(value) {
  return Number(value) || 0;
}

function buildRegistrationMap(registrations = []) {
  return (Array.isArray(registrations) ? registrations : []).reduce((result, registration) => {
    if (registration && registration._id) {
      result[registration._id] = registration;
    }
    return result;
  }, {});
}

function sortDepartmentRankings(items, sortKey = 'total') {
  return items.sort((a, b) => {
    const primary = toNumber(b[sortKey]) - toNumber(a[sortKey]);
    if (primary !== 0) {
      return primary;
    }

    return b.total - a.total || b.win - a.win || b.match - a.match || a.departmentName.localeCompare(b.departmentName, 'zh-Hans-CN');
  });
}

function normalizeDepartmentRecord(record) {
  const departmentName = normalizeDepartment(record.departmentName || record.department);

  return {
    _id: record._id || `department-${departmentName}`,
    departmentName,
    playerCount: toNumber(record.playerCount),
    total: toNumber(record.total),
    win: toNumber(record.win),
    match: toNumber(record.match),
    players: Array.isArray(record.players) ? record.players : []
  };
}

function getRankingDepartment(ranking, registrationMap) {
  const registration = registrationMap[ranking.playerId] || {};
  return normalizeDepartment(ranking.department || registration.department);
}

function buildDepartmentRankings(rankings = [], registrations = [], sortKey = 'total', departmentRecords = []) {
  if (Array.isArray(departmentRecords) && departmentRecords.length > 0) {
    return sortDepartmentRankings(departmentRecords.map(normalizeDepartmentRecord), sortKey);
  }

  const registrationMap = buildRegistrationMap(registrations);
  const departments = {};

  (Array.isArray(rankings) ? rankings : []).forEach(ranking => {
    const departmentName = getRankingDepartment(ranking, registrationMap);

    if (!departments[departmentName]) {
      departments[departmentName] = {
        _id: `department-${departmentName}`,
        departmentName,
        playerCount: 0,
        total: 0,
        win: 0,
        match: 0,
        players: []
      };
    }

    departments[departmentName].playerCount += 1;
    departments[departmentName].total += toNumber(ranking.total);
    departments[departmentName].win += toNumber(ranking.win);
    departments[departmentName].match += toNumber(ranking.match);
    departments[departmentName].players.push(ranking.playerName || '未知选手');
  });

  return sortDepartmentRankings(Object.keys(departments).map(name => departments[name]), sortKey);
}

function getDepartmentOptions(registrations = []) {
  const departments = new Set();

  (Array.isArray(registrations) ? registrations : []).forEach(registration => {
    const department = String(registration.department || '').trim();
    if (department) {
      departments.add(department);
    }
  });

  return Array.from(departments).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
}

function filterDepartmentOptions(options = [], keyword = '') {
  const text = String(keyword || '').trim().toLowerCase();
  const safeOptions = Array.isArray(options) ? options : [];

  if (!text) {
    return safeOptions;
  }

  return safeOptions.filter(option => String(option).toLowerCase().indexOf(text) >= 0);
}

module.exports = {
  buildDepartmentRankings,
  getDepartmentOptions,
  filterDepartmentOptions
};

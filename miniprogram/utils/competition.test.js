const assert = require('assert');
const competition = require('./competition');
const {
  buildRegistrationStats,
  drawDepartmentMatches
} = competition;

const participants = [
  { _id: '1', name: 'Alice', department: '研发部', gender: '女' },
  { _id: '2', name: 'Bob', department: '研发部', gender: '男' },
  { _id: '3', name: 'Cindy', department: '市场部', gender: '女' },
  { _id: '4', name: 'David', department: '销售部', gender: '男' },
  { _id: '5', name: 'Evan', department: '销售部', gender: '男' }
];

function fixedRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

function testStats() {
  const stats = buildRegistrationStats(participants);

  assert.strictEqual(stats.total, 5);
  assert.deepStrictEqual(stats.departmentStats, [
    { name: '研发部', count: 2, percent: 40 },
    { name: '销售部', count: 2, percent: 40 },
    { name: '市场部', count: 1, percent: 20 }
  ]);
  assert.deepStrictEqual(stats.genderStats, [
    { name: '男', count: 3, percent: 60 },
    { name: '女', count: 2, percent: 40 }
  ]);
}

function testDepartmentDraw() {
  const draw = drawDepartmentMatches(participants, {
    random: fixedRandom([0.9, 0.2, 0.6])
  });

  assert.strictEqual(draw.length, 2);
  assert.strictEqual(draw[0].status, 'matched');
  assert.strictEqual(draw[0].departmentA.participantCount + draw[0].departmentB.participantCount, 3);
  assert.strictEqual(draw[1].status, 'bye');
  assert.strictEqual(draw.flatMap(match => [match.departmentA.name, match.departmentB && match.departmentB.name].filter(Boolean)).sort().join(','), '市场部,研发部,销售部');
}

function testRandomTeamsApiRemoved() {
  assert.strictEqual(competition.buildRandomTeams, undefined);
}

testStats();
testDepartmentDraw();
testRandomTeamsApiRemoved();

console.log('competition tests passed');

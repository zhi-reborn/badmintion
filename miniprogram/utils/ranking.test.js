const assert = require('assert');
const {
  buildDepartmentRankings,
  getDepartmentOptions,
  filterDepartmentOptions
} = require('./ranking');

function testBuildDepartmentRankings() {
  const rankings = [
    { playerId: 'p1', playerName: 'Alice', total: 3, win: 3, match: 4 },
    { playerId: 'p2', playerName: 'Bob', department: '研发部', total: 1, win: 1, match: 2 },
    { playerId: 'p3', playerName: 'Cindy', total: 2, win: 2, match: 2 },
    { playerId: 'p4', playerName: 'David', total: 1, win: 1, match: 1 }
  ];
  const registrations = [
    { _id: 'p1', department: '研发部' },
    { _id: 'p3', department: '市场部' },
    { _id: 'p4', department: '' }
  ];

  const result = buildDepartmentRankings(rankings, registrations);

  assert.deepStrictEqual(result, [
    {
      _id: 'department-研发部',
      departmentName: '研发部',
      playerCount: 2,
      total: 4,
      win: 4,
      match: 6,
      players: ['Alice', 'Bob']
    },
    {
      _id: 'department-市场部',
      departmentName: '市场部',
      playerCount: 1,
      total: 2,
      win: 2,
      match: 2,
      players: ['Cindy']
    },
    {
      _id: 'department-未填写部门',
      departmentName: '未填写部门',
      playerCount: 1,
      total: 1,
      win: 1,
      match: 1,
      players: ['David']
    }
  ]);
}

function testSortDepartmentRankingsByCurrentType() {
  const result = buildDepartmentRankings([
    { playerId: 'p1', department: '研发部', total: 1, win: 1, match: 10 },
    { playerId: 'p2', department: '市场部', total: 3, win: 3, match: 3 }
  ], [], 'match');

  assert.deepStrictEqual(result.map(item => item.departmentName), ['研发部', '市场部']);
}

function testPreferDepartmentRankingRecords() {
  const result = buildDepartmentRankings([
    { playerId: 'p1', department: '研发部', total: 99, win: 99, match: 99 }
  ], [], 'total', [
    { _id: 'd1', departmentName: '市场部', total: 2, win: 2, match: 3 },
    { _id: 'd2', department: '研发部', total: 5, win: 5, match: 5 }
  ]);

  assert.deepStrictEqual(result.map(item => ({
    departmentName: item.departmentName,
    total: item.total,
    win: item.win,
    match: item.match
  })), [
    { departmentName: '研发部', total: 5, win: 5, match: 5 },
    { departmentName: '市场部', total: 2, win: 2, match: 3 }
  ]);
}

function testDepartmentSearchOptions() {
  const options = getDepartmentOptions([
    { department: '研发一部' },
    { department: '市场部' },
    { department: '研发一部' },
    { department: '' }
  ]);

  assert.deepStrictEqual(options, ['市场部', '研发一部']);
  assert.deepStrictEqual(filterDepartmentOptions(options, '研发'), ['研发一部']);
  assert.deepStrictEqual(filterDepartmentOptions(options, ''), options);
}

testBuildDepartmentRankings();
testSortDepartmentRankingsByCurrentType();
testPreferDepartmentRankingRecords();
testDepartmentSearchOptions();

console.log('ranking tests passed');

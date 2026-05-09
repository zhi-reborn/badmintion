const assert = require('assert');
const {
  filterRegistrationsForLogin,
  getRegistrationForActivity,
  getReusableRegistration,
  getLoginUserKey,
  buildActivitySelection
} = require('./registration-flow');

const registrations = [
  {
    _id: 'old-1',
    name: 'Alice',
    department: '研发部',
    gender: '女',
    activityIds: ['activity-a']
  },
  {
    _id: 'old-2',
    name: 'Bob',
    department: '市场部',
    gender: '男',
    activityIds: ['activity-b']
  }
];

function testFindExistingActivityRegistration() {
  const registration = getRegistrationForActivity(registrations, 'activity-b');

  assert.strictEqual(registration._id, 'old-2');
}

function testFilterRegistrationsByCurrentLoginAccount() {
  const allRegistrations = [
    { _id: 'alice-new', userKey: '13800138000', phone: '13900000000', activityIds: ['activity-a'] },
    { _id: 'bob-new', userKey: '13800138001', phone: '13900000001', activityIds: ['activity-a'] },
    { _id: 'alice-old', phone: '13800138000', activityIds: ['activity-c'] }
  ];
  const loginInfo = { nickName: 'Alice', phone: '13800138000' };

  const filtered = filterRegistrationsForLogin(allRegistrations, loginInfo);

  assert.deepStrictEqual(filtered.map(registration => registration._id), ['alice-new', 'alice-old']);
  assert.strictEqual(getRegistrationForActivity(allRegistrations, 'activity-a', loginInfo)._id, 'alice-new');
  assert.strictEqual(getRegistrationForActivity(allRegistrations, 'activity-b', loginInfo), null);
}

function testFindReusableCompleteRegistration() {
  const registration = getReusableRegistration([
    { _id: 'incomplete', name: 'No Department', gender: '男' },
    ...registrations
  ]);

  assert.strictEqual(registration._id, 'old-1');
}

function testBuildPreselectedActivity() {
  const activities = buildActivitySelection([
    { _id: 'activity-a', title: '常规活动' },
    { _id: 'activity-c', title: '公司赛' }
  ], ['activity-c']);

  assert.deepStrictEqual(
    activities.map(activity => ({ id: activity._id, checked: activity.checked })),
    [
      { id: 'activity-a', checked: false },
      { id: 'activity-c', checked: true }
    ]
  );
}

function testGetLoginUserKey() {
  assert.strictEqual(getLoginUserKey({ phone: ' 13800138000 ', nickName: 'Alice' }), '13800138000');
  assert.strictEqual(getLoginUserKey({ nickName: 'Alice' }), 'Alice');
  assert.strictEqual(getLoginUserKey(null), '');
}

testFindExistingActivityRegistration();
testFilterRegistrationsByCurrentLoginAccount();
testFindReusableCompleteRegistration();
testBuildPreselectedActivity();
testGetLoginUserKey();

console.log('registration flow tests passed');

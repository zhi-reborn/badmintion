function getActivityIds(registration) {
  return Array.isArray(registration && registration.activityIds)
    ? registration.activityIds
    : [];
}

function getLoginUserKey(loginInfo) {
  if (!loginInfo) {
    return '';
  }

  return String(loginInfo.userKey || loginInfo.phone || loginInfo.nickName || loginInfo.name || '').trim();
}

function getRegistrationUserKey(registration) {
  if (!registration) {
    return '';
  }

  return String(
    registration.userKey ||
    registration.loginPhone ||
    registration.accountKey ||
    registration.phone ||
    ''
  ).trim();
}

function isRegistrationForLogin(registration, loginInfo) {
  const loginUserKey = getLoginUserKey(loginInfo);

  if (!loginUserKey) {
    return false;
  }

  return getRegistrationUserKey(registration) === loginUserKey;
}

function filterRegistrationsForLogin(registrations = [], loginInfo) {
  if (!Array.isArray(registrations)) {
    return [];
  }

  if (!loginInfo) {
    return registrations;
  }

  return registrations.filter(registration => isRegistrationForLogin(registration, loginInfo));
}

function getRegistrationForActivity(registrations = [], activityId, loginInfo) {
  if (!activityId || !Array.isArray(registrations)) {
    return null;
  }

  return filterRegistrationsForLogin(registrations, loginInfo)
    .find(registration => getActivityIds(registration).includes(activityId)) || null;
}

function hasCompleteCompanyInfo(registration) {
  return Boolean(
    registration &&
    String(registration.department || '').trim() &&
    registration.gender
  );
}

function getReusableRegistration(registrations = [], loginInfo) {
  if (!Array.isArray(registrations)) {
    return null;
  }

  return filterRegistrationsForLogin(registrations, loginInfo).find(hasCompleteCompanyInfo) || null;
}

function buildActivitySelection(activities = [], selectedIds = []) {
  const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);

  return (Array.isArray(activities) ? activities : []).map(activity => ({
    ...activity,
    checked: selectedSet.has(activity._id)
  }));
}

module.exports = {
  filterRegistrationsForLogin,
  getRegistrationForActivity,
  getReusableRegistration,
  getLoginUserKey,
  getRegistrationUserKey,
  buildActivitySelection
};

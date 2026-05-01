const db = wx.cloud.database();

const getPlayers = (options = {}) => {
  const { limit = 20, skip = 0, orderBy = 'createTime', order = 'desc' } = options;
  
  return db.collection('registrations')
    .orderBy(orderBy, order)
    .skip(skip)
    .limit(limit)
    .get();
};

const getPlayerById = id => {
  return db.collection('registrations').doc(id).get();
};

const getMatchItems = (options = {}) => {
  const { status, limit = 20, skip = 0 } = options;
  
  let query = db.collection('match_items')
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(limit);
  
  if (status) {
    query = query.where({ status });
  }
  
  return query.get();
};

const getMatches = (options = {}) => {
  const { itemId, limit = 20, skip = 0 } = options;
  
  let query = db.collection('matches')
    .orderBy('matchTime', 'desc')
    .skip(skip)
    .limit(limit);
  
  if (itemId) {
    query = query.where({ itemId });
  }
  
  return query.get();
};

const checkIsAdmin = () => {
  const userInfo = wx.getStorageSync('userInfo');
  return userInfo && userInfo.isAdmin;
};

module.exports = {
  getPlayers,
  getPlayerById,
  getMatchItems,
  getMatches,
  checkIsAdmin
};

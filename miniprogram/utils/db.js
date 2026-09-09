// 分页拉取集合数据（小程序端单次查询上限 20 条）
// options: { where, orderBy, orderDir, max }
function fetchAll(db, collection, options) {
  options = options || {};
  const max = options.max || 500;
  const pageSize = 20;
  const results = [];

  function fetchPage(skip) {
    let query = db.collection(collection);
    if (options.where) query = query.where(options.where);
    if (options.orderBy) query = query.orderBy(options.orderBy, options.orderDir || 'desc');
    return query.skip(skip).limit(pageSize).get().then(res => {
      results.push.apply(results, res.data);
      if (res.data.length === pageSize && results.length < max) {
        return fetchPage(skip + pageSize);
      }
      return results;
    });
  }

  return fetchPage(0);
}

// 实时统计每个活动的真实报名人数，并把结果写回 currentCount 字段。
// activities 集合里的 currentCount 由客户端在报名/取消时手工增减，
// 任何一次 _.inc 失败都会导致计数漂移，因此展示时应以实时统计为准。
function attachRealRegistrationCounts(db, activities) {
  const list = Array.isArray(activities) ? activities : [];

  if (list.length === 0) {
    return Promise.resolve(list);
  }

  const _ = db.command;
  const tasks = list.map(activity =>
    db.collection('registrations')
      .where({ activityIds: _.in([activity._id]) })
      .count()
      .then(res => ({ ...activity, currentCount: res.total }))
      .catch(() => activity) // 统计失败时回退到原有计数字段
  );

  return Promise.all(tasks);
}

module.exports = { fetchAll, attachRealRegistrationCounts };

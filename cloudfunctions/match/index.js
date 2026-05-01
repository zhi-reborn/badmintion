const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'addItem':
      return await addMatchItem(data);
    case 'deleteItem':
      return await deleteMatchItem(data.id);
    case 'addMatch':
      return await addMatch(data);
    case 'getMatches':
      return await getMatches(data.itemId);
    default:
      return {
        code: -1,
        message: '未知操作'
      };
  }
};

async function addMatchItem(data) {
  try {
    const result = await db.collection('match_items').add({
      data: {
        ...data,
        createTime: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '创建成功',
      data: result
    };
  } catch (err) {
    console.error('创建比赛项目失败', err);
    return {
      code: -1,
      message: '创建失败'
    };
  }
}

async function deleteMatchItem(id) {
  try {
    await db.collection('match_items').doc(id).remove();

    return {
      code: 0,
      message: '删除成功'
    };
  } catch (err) {
    console.error('删除比赛项目失败', err);
    return {
      code: -1,
      message: '删除失败'
    };
  }
}

async function addMatch(data) {
  try {
    const result = await db.collection('matches').add({
      data: {
        ...data,
        matchTime: db.serverDate(),
        createTime: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '录入成功',
      data: result
    };
  } catch (err) {
    console.error('录入比赛结果失败', err);
    return {
      code: -1,
      message: '录入失败'
    };
  }
}

async function getMatches(itemId) {
  try {
    const result = await db.collection('matches')
      .where({
        itemId: itemId
      })
      .orderBy('matchTime', 'desc')
      .get();

    return {
      code: 0,
      data: result.data
    };
  } catch (err) {
    console.error('获取比赛结果失败', err);
    return {
      code: -1,
      message: '获取失败'
    };
  }
}

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'updateSkill':
      return await updatePlayerSkill(data.id, data.skillLevel);
    case 'checkAdmin':
      return await checkAdminPermission(wxContext.OPENID);
    default:
      return {
        code: -1,
        message: '未知操作'
      };
  }
};

async function updatePlayerSkill(id, skillLevel) {
  try {
    await db.collection('registrations').doc(id).update({
      data: {
        skillLevel: skillLevel
      }
    });

    return {
      code: 0,
      message: '修改成功'
    };
  } catch (err) {
    console.error('修改技术等级失败', err);
    return {
      code: -1,
      message: '修改失败'
    };
  }
}

async function checkAdminPermission(openid) {
  try {
    const result = await db.collection('users')
      .where({
        _openid: openid,
        isAdmin: true
      })
      .get();

    return {
      code: 0,
      isAdmin: result.data.length > 0
    };
  } catch (err) {
    console.error('检查管理员权限失败', err);
    return {
      code: -1,
      isAdmin: false
    };
  }
}

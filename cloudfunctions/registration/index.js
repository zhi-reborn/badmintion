const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action, data } = event;

  switch (action) {
    case 'add':
      return await addRegistration(data, wxContext.OPENID);
    case 'getByUser':
      return await getRegistrationByUser(wxContext.OPENID);
    case 'cancel':
      return await cancelRegistration(data.id, wxContext.OPENID);
    default:
      return {
        code: -1,
        message: '未知操作'
      };
  }
};

async function addRegistration(data, openid) {
  try {
    const registrationData = data || {};
    const userKey = String(registrationData.userKey || registrationData.phone || '').trim();

    if (!String(registrationData.department || '').trim()) {
      return {
        code: -1,
        message: '请填写部门'
      };
    }

    if (!registrationData.gender) {
      return {
        code: -1,
        message: '请选择性别'
      };
    }

    const existResult = await db.collection('registrations')
      .where({
        _openid: openid
      })
      .get();

    const hasSameAccountRegistration = existResult.data.some(registration => {
      const registrationUserKey = String(
        registration.userKey ||
        registration.loginPhone ||
        registration.accountKey ||
        registration.phone ||
        ''
      ).trim();

      return registrationUserKey === userKey;
    });

    if (hasSameAccountRegistration) {
      return {
        code: -1,
        message: '您已报名，请勿重复报名'
      };
    }

    const result = await db.collection('registrations').add({
      data: {
        ...registrationData,
        userKey,
        _openid: openid,
        createTime: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '报名成功',
      data: result
    };
  } catch (err) {
    console.error('报名失败', err);
    return {
      code: -1,
      message: '报名失败'
    };
  }
}

async function getRegistrationByUser(openid) {
  try {
    const result = await db.collection('registrations')
      .where({
        _openid: openid
      })
      .get();

    return {
      code: 0,
      data: result.data
    };
  } catch (err) {
    console.error('获取报名信息失败', err);
    return {
      code: -1,
      message: '获取报名信息失败'
    };
  }
}

async function cancelRegistration(id, openid) {
  try {
    const result = await db.collection('registrations')
      .where({
        _id: id,
        _openid: openid
      })
      .remove();

    return {
      code: 0,
      message: '取消报名成功'
    };
  } catch (err) {
    console.error('取消报名失败', err);
    return {
      code: -1,
      message: '取消报名失败'
    };
  }
}

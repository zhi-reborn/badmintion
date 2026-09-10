const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    name: ''
  },

  onLoad: function () {
  },

  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },

  doLogin: function () {
    const { name } = this.data;

    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    app.getUserOpenId(openid => {
      if (!openid) {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
        return;
      }

      this.checkAndLogin(openid, name.trim());
    });
  },

  checkAndLogin: function (openid, name) {
    db.collection('users').where({
      nickName: name
    }).get().then(res => {
      if (res.data.length > 0) {
        const existingUser = res.data[0];
        if (existingUser._openid !== openid) {
          wx.hideLoading();
          wx.showToast({
            title: '用户名已被使用',
            icon: 'none'
          });
          return;
        }
      }

      this.saveUserInfo(openid, name);
    }).catch(err => {
      wx.hideLoading();
      console.error('检查用户名失败', err);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    });
  },

  saveUserInfo: function (openid, name) {
    db.collection('users').where({
      _openid: openid
    }).get().then(userRes => {
      if (userRes.data.length > 0) {
        // 老账号沿用原有手机号作为 userKey，保证历史报名记录关联不变
        const existingPhone = userRes.data[0].phone || '';
        return db.collection('users').doc(userRes.data[0]._id).update({
          data: {
            nickName: name,
            loginType: 'name',
            loginTime: db.serverDate()
          }
        }).then(() => existingPhone);
      }

      return db.collection('users').add({
        data: {
          nickName: name,
          loginType: 'name',
          loginTime: db.serverDate()
        }
      }).then(() => '');
    }).then(existingPhone => {
      app.setLoginInfo({
        nickName: name,
        phone: existingPhone,
        loginType: 'name'
      });

      wx.hideLoading();
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(err => {
      wx.hideLoading();
      console.error('登录失败', err);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    });
  }
});

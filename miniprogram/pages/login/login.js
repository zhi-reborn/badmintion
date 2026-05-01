const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    name: '',
    phone: ''
  },

  onLoad: function () {
  },

  onNameInput: function (e) {
    this.setData({ name: e.detail.value });
  },

  onPhoneInput: function (e) {
    this.setData({ phone: e.detail.value });
  },

  doLogin: function () {
    const { name, phone } = this.data;
    
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
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

      this.checkAndLogin(openid, name.trim(), phone);
    });
  },

  checkAndLogin: function (openid, name, phone) {
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

      this.saveUserInfo(openid, name, phone);
    }).catch(err => {
      wx.hideLoading();
      console.error('检查用户名失败', err);
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      });
    });
  },

  saveUserInfo: function (openid, name, phone) {
    const loginData = {
      nickName: name,
      phone: phone,
      loginType: 'phone',
      loginTime: db.serverDate()
    };

    db.collection('users').where({
      _openid: openid
    }).get().then(userRes => {
      if (userRes.data.length > 0) {
        return db.collection('users').doc(userRes.data[0]._id).update({
          data: loginData
        });
      } else {
        return db.collection('users').add({
          data: loginData
        });
      }
    }).then(() => {
      const userData = {
        nickName: name,
        phone: phone,
        loginType: 'phone'
      };
      app.setLoginInfo(userData);
      
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
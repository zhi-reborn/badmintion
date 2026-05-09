App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3g6x5hw61323fdb5',
        traceUser: true,
      });
    }

    this.globalData = {
      loginInfo: null,
      userInfo: null,
      openid: null,
      isAdmin: false
    };

    this.checkLogin();
  },

  checkLogin: function() {
    const loginInfo = wx.getStorageSync('loginInfo');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (loginInfo) {
      this.globalData.loginInfo = loginInfo;
    }
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isAdmin = userInfo.isAdmin || false;
    }
  },

  isLoggedIn: function() {
    return !!this.globalData.loginInfo;
  },

  getLoginInfo: function() {
    return this.globalData.loginInfo;
  },

  getCurrentUserKey: function() {
    const loginInfo = this.getLoginInfo() || {};
    return String(loginInfo.userKey || loginInfo.phone || loginInfo.nickName || loginInfo.name || '').trim();
  },

  setLoginInfo: function(info) {
    const loginInfo = {
      ...info,
      userKey: String(info && (info.userKey || info.phone || info.nickName || info.name) || '').trim()
    };

    this.globalData.loginInfo = loginInfo;
    wx.setStorageSync('loginInfo', loginInfo);
  },

  clearLoginInfo: function() {
    this.globalData.loginInfo = null;
    this.globalData.userInfo = null;
    this.globalData.isAdmin = false;
    wx.removeStorageSync('loginInfo');
  },

  getUserOpenId: function(callback) {
    if (this.globalData.openid) {
      callback(this.globalData.openid);
      return;
    }

    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('获取openid成功', res.result.openid);
        this.globalData.openid = res.result.openid;
        callback(res.result.openid);
      },
      fail: err => {
        console.error('获取openid失败', err);
        wx.showToast({
          title: '请先部署login云函数',
          icon: 'none',
          duration: 3000
        });
        callback(null);
      }
    });
  }
});

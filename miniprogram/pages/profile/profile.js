const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    loginInfo: null,
    userInfo: null,
    stats: {
      totalMatches: 0,
      wins: 0,
      totalPoints: 0,
      ranking: 0
    },
    myActivities: [],
    myRegistrations: [],
    isAdmin: false,
    openid: ''
  },

  onLoad: function () {
    this.loadLoginInfo();
    this.getOpenId();
  },

  onShow: function () {
    this.loadLoginInfo();
  },

  loadLoginInfo: function () {
    const loginInfo = app.getLoginInfo();
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({
      loginInfo: loginInfo,
      userInfo: userInfo
    });
    
    if (loginInfo) {
      this.loadUserStats();
    }
  },

  getOpenId: function () {
    app.getUserOpenId(openid => {
      if (openid) {
        this.setData({ openid: openid });
        this.checkAdminStatus(openid);
      }
    });
  },

  checkAdminStatus: function (openid) {
    if (!openid) {
      console.error('openid为空，无法检查管理员状态');
      return;
    }
    
    db.collection('admins').where({
      _openid: openid
    }).get().then(res => {
      console.log('查询admins结果:', res);
      const isAdmin = res.data.length > 0;
      console.log('是否管理员:', isAdmin);
      this.setData({ isAdmin: isAdmin });
    }).catch(err => {
      console.error('检查管理员状态失败', err);
      this.setData({ isAdmin: false });
    });
  },

  loadUserStats: function () {
    app.getUserOpenId(openid => {
      db.collection('rankings').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length > 0) {
          const ranking = res.data[0];
          this.setData({
            stats: {
              totalMatches: ranking.match || 0,
              wins: ranking.win || 0,
              totalPoints: ranking.total || 0,
              ranking: ranking.rank || 0
            }
          });
        }
      });
    });
  },

  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  goToRegister: function () {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  goToAdmin: function () {
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '无管理员权限',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/admin/index/index'
    });
  },

  goToMyMatches: function () {
    wx.navigateTo({
      url: '/pages/my-matches/my-matches'
    });
  },

  goToMyActivities: function () {
    wx.navigateTo({
      url: '/pages/my-activities/my-activities'
    });
  },

  goToMyAlbum: function () {
    wx.navigateTo({
      url: '/pages/my-album/my-album'
    });
  },

  goToMyFavorites: function () {
    wx.navigateTo({
      url: '/pages/my-favorites/my-favorites'
    });
  },

  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: res => {
        if (res.confirm) {
          app.clearLoginInfo();
          wx.removeStorageSync('userInfo');
          this.setData({
            loginInfo: null,
            userInfo: null,
            stats: {
              totalMatches: 0,
              wins: 0,
              totalPoints: 0,
              ranking: 0
            },
            isAdmin: false
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  onPullDownRefresh: function () {
    this.loadLoginInfo();
    wx.stopPullDownRefresh();
  },

  copyOpenid: function () {
    wx.setClipboardData({
      data: this.data.openid,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  }
});
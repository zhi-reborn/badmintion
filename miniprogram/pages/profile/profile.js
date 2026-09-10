const app = getApp();
const db = wx.cloud.database();
const { fetchAll } = require('../../utils/db');

Page({
  data: {
    loginInfo: null,
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

    this.setData({
      loginInfo: loginInfo
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
      this.setData({ isAdmin: res.data.length > 0 });
    }).catch(err => {
      console.error('检查管理员状态失败', err);
      this.setData({ isAdmin: false });
    });
  },

  loadUserStats: function () {
    app.getUserOpenId(openid => {
      if (!openid) return;
      fetchAll(db, 'rankings', { orderBy: 'total' }).then(list => {
        const sorted = list.slice().sort((a, b) => (b.total || 0) - (a.total || 0));
        const ranking = sorted.find(r => r.playerOpenid === openid);
        if (ranking) {
          this.setData({
            stats: {
              totalMatches: ranking.match || 0,
              wins: ranking.win || 0,
              totalPoints: ranking.total || 0,
              ranking: sorted.indexOf(ranking) + 1
            }
          });
        }
        wx.stopPullDownRefresh();
      }).catch(err => {
        console.error('加载个人战绩失败', err);
        wx.stopPullDownRefresh();
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
          this.setData({
            loginInfo: null,
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
    this.getOpenId();
  },

  onShareAppMessage: function () {
    return {
      title: '羽毛球协会 · 羽你同行',
      path: '/pages/index/index'
    };
  },

  onShareTimeline: function () {
    return { title: '羽毛球协会 · 羽你同行' };
  }
});
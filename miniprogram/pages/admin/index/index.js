const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    isAdmin: false,
    checking: true
  },

  onLoad: function () {
    this.checkAdmin();
  },

  checkAdmin: function () {
    app.getUserOpenId(openid => {
      if (!openid) {
        this.showNoPermission();
        return;
      }
      
      db.collection('admins').where({
        _openid: openid
      }).get().then(res => {
        const isAdmin = res.data.length > 0;
        if (isAdmin) {
          this.setData({ isAdmin: true, checking: false });
        } else {
          this.showNoPermission();
        }
      }).catch(err => {
        console.error('检查管理员权限失败', err);
        this.showNoPermission();
      });
    });
  },

  showNoPermission: function () {
    this.setData({ checking: false });
    wx.showModal({
      title: '无权限',
      content: '您不是管理员，无法访问管理后台',
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },

  goToPlayerManage: function () {
    wx.navigateTo({
      url: '/pages/admin/players/players'
    });
  },

  goToMatchManage: function () {
    wx.navigateTo({
      url: '/pages/admin/matches/matches'
    });
  },

  goToActivityManage: function () {
    wx.navigateTo({
      url: '/pages/admin/activities/activities'
    });
  },

  goToVenueManage: function () {
    wx.navigateTo({
      url: '/pages/admin/venues/venues'
    });
  }
});

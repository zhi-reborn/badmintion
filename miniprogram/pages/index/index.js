const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    isAdmin: false,
    banners: [
      { id: 1, image: '', title: '欢迎参加羽毛球比赛' }
    ],
    hotActivities: [],
    matchStats: {
      totalPlayers: 0,
      totalMatches: 0,
      ongoingItems: 0
    },
    quickActions: [
      { icon: '🏸', name: '立即报名', url: '/pages/register/register' },
      { icon: '📅', name: '活动中心', url: '/pages/activities/activities' },
      { icon: '🏟️', name: '场地预订', url: '/pages/venues/venues' },
      { icon: '🏆', name: '排行榜', url: '/pages/ranking/ranking' }
    ]
  },

  onLoad: function () {
    this.checkUserInfo();
    this.loadMatchStats();
    this.loadHotActivities();
  },

  onShow: function () {
    this.checkUserInfo();
    this.loadMatchStats();
    this.loadHotActivities();
  },

  checkUserInfo: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true,
        isAdmin: userInfo.isAdmin || false
      });
      app.globalData.userInfo = userInfo;
      app.globalData.isAdmin = userInfo.isAdmin || false;
    }
  },

  loadMatchStats: function () {
    db.collection('registrations').count().then(res => {
      this.setData({ 'matchStats.totalPlayers': res.total });
    }).catch(err => { });

    db.collection('matches').count().then(res => {
      this.setData({ 'matchStats.totalMatches': res.total });
    }).catch(err => { });

    db.collection('match_items').where({
      status: '进行中'
    }).count().then(res => {
      this.setData({ 'matchStats.ongoingItems': res.total });
    }).catch(err => { });
  },

  loadHotActivities: function () {
    db.collection('activities')
      .where({
        status: _.in(['报名中', '进行中'])
      })
      .orderBy('createTime', 'desc')
      .limit(3)
      .get()
      .then(res => {
        console.log('加载热门活动成功', res.data.length);
        this.setData({ hotActivities: res.data });
      })
      .catch(err => {
        console.error('加载热门活动失败', err);
      });
  },

  goToQuickAction: function (e) {
    const url = e.currentTarget.dataset.url;
    const tabBarPages = ['/pages/activities/activities', '/pages/venues/venues', '/pages/ranking/ranking'];
    
    if (tabBarPages.indexOf(url) >= 0) {
      wx.switchTab({ url: url });
    } else {
      wx.navigateTo({ url: url });
    }
  },

  goToActivityDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    });
  },

  goToAdmin: function () {
    if (!this.data.isAdmin) {
      wx.showToast({ title: '无管理员权限', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/admin/index/index' });
  },

  onPullDownRefresh: function () {
    this.loadMatchStats();
    this.loadHotActivities();
    wx.stopPullDownRefresh();
  }
});

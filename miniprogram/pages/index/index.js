const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const { attachRealRegistrationCounts } = require('../../utils/db');

Page({
  data: {
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
    app.getUserOpenId(openid => {
      if (!openid) return;
      db.collection('admins').where({
        _openid: openid
      }).get().then(res => {
        this.setData({ isAdmin: res.data.length > 0 });
      }).catch(err => {
        console.error('检查管理员状态失败', err);
        this.setData({ isAdmin: false });
      });
    });
  },

  loadMatchStats: function () {
    db.collection('registrations').count().then(res => {
      this.animateStat('totalPlayers', res.total);
    }).catch(err => { });

    db.collection('matches').count().then(res => {
      this.animateStat('totalMatches', res.total);
    }).catch(err => { });

    db.collection('match_items').where({
      status: '进行中'
    }).count().then(res => {
      this.animateStat('ongoingItems', res.total);
    }).catch(err => { });
  },

  // 数字滚动动画：从当前显示值缓动到目标值
  animateStat: function (key, target) {
    if (!this._statTimers) this._statTimers = {};
    if (this._statTimers[key]) clearTimeout(this._statTimers[key]);

    var from = this.data.matchStats[key] || 0;
    var start = Date.now();
    var duration = 700;

    var tick = () => {
      var p = Math.min((Date.now() - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      this.setData({ ['matchStats.' + key]: Math.round(from + (target - from) * eased) });
      if (p < 1) this._statTimers[key] = setTimeout(tick, 30);
    };
    tick();
  },

  loadHotActivities: function () {
    db.collection('activities')
      .where({
        status: _.in(['报名中', '进行中'])
      })
      .orderBy('createTime', 'desc')
      .limit(3)
      .get()
      .then(res => attachRealRegistrationCounts(db, res.data))
      .then(list => {
        const hotActivities = list.map(item => ({
          ...item,
          typeClass: item.type === '比赛' ? 'match' : item.type === '约球' ? 'play' : 'train',
          progressPct: item.maxCount
            ? Math.min(100, Math.round(((item.currentCount || 0) / item.maxCount) * 100))
            : 0
        }));
        this.setData({ hotActivities });
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('加载热门活动失败', err);
        wx.stopPullDownRefresh();
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

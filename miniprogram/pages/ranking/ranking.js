const db = wx.cloud.database();
const { fetchAll } = require('../../utils/db');
const {
  buildDepartmentRankings
} = require('../../utils/ranking');

Page({
  data: {
    rankings: [],
    rawRankings: [],
    registrations: [],
    currentMode: 'player',
    currentType: 'total',
    modes: [
      { key: 'player', name: '个人榜' },
      { key: 'department', name: '团体榜' }
    ],
    types: [
      { key: 'total', name: '总积分' },
      { key: 'win', name: '胜场' },
      { key: 'match', name: '参赛数' }
    ],
    loading: true,
    matchResults: []
  },

  onLoad: function () {
    this.loadRankings();
    this.loadMatchResults();
  },

  onShow: function () {
    this.loadRankings();
    this.loadMatchResults();
  },

  loadRankings: function () {
    Promise.all([
      fetchAll(db, 'rankings', { orderBy: this.data.currentType, max: 200 }),
      fetchAll(db, 'registrations', { orderBy: 'createTime', max: 500 })
    ]).then(([rankings, registrations]) => {
      this.setData({
        rawRankings: rankings,
        registrations: registrations,
        rankings: this.buildDisplayRankings(rankings, registrations),
        loading: false
      });
      wx.stopPullDownRefresh();
    })
    .catch(err => {
      console.error('加载排行榜失败', err);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  loadMatchResults: function () {
    fetchAll(db, 'matches', { orderBy: 'createTime', max: 20 }).then(list => {
      this.setData({ matchResults: list });
    }).catch(err => {
      console.error('加载比赛结果失败', err);
    });
  },

  onTypeChange: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.loadRankings();
  },

  onModeChange: function (e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      currentMode: mode,
      rankings: this.buildDisplayRankings(this.data.rawRankings, this.data.registrations, mode)
    });
  },

  buildDisplayRankings: function (rankings, registrations, mode) {
    const currentMode = mode || this.data.currentMode;

    if (currentMode === 'department') {
      return buildDepartmentRankings(rankings, registrations, this.data.currentType).slice(0, 50);
    }

    return (rankings || []).slice(0, 50);
  },

  goToHome: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onPullDownRefresh: function () {
    this.loadRankings();
    this.loadMatchResults();
  },

  onShareAppMessage: function () {
    return {
      title: '羽毛球协会 · 排行榜',
      path: '/pages/ranking/ranking'
    };
  },

  onShareTimeline: function () {
    return { title: '羽毛球协会 · 排行榜' };
  }
});

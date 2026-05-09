const db = wx.cloud.database();
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
      { key: 'department', name: '部门榜' }
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
      db.collection('rankings')
        .orderBy(this.data.currentType, 'desc')
        .limit(200)
        .get(),
      db.collection('registrations')
        .limit(500)
        .get()
    ]).then(([rankingRes, registrationRes]) => {
      const rankings = this.buildDisplayRankings(rankingRes.data, registrationRes.data);
      this.setData({
        rawRankings: rankingRes.data,
        registrations: registrationRes.data,
        rankings: rankings,
        loading: false
      });
    })
      .catch(err => {
        console.error('加载排行榜失败', err);
        this.setData({ loading: false });
      });
  },

  loadMatchResults: function () {
    db.collection('matches')
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()
      .then(res => {
        console.log('加载比赛结果成功', res.data.length);
        this.setData({ matchResults: res.data });
      })
      .catch(err => {
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

  getScoreLabel: function () {
    if (this.data.currentType === 'total') return '积分';
    if (this.data.currentType === 'win') return '胜场';
    return '场次';
  },

  getRankClass: function (index) {
    if (index === 0) return 'rank-first';
    if (index === 1) return 'rank-second';
    if (index === 2) return 'rank-third';
    return '';
  },

  goToHome: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onPullDownRefresh: function () {
    this.loadRankings();
    this.loadMatchResults();
    wx.stopPullDownRefresh();
  }
});

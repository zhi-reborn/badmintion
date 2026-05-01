const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    rankings: [],
    currentType: 'total',
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
    db.collection('rankings')
      .orderBy(this.data.currentType, 'desc')
      .limit(50)
      .get()
      .then(res => {
        this.setData({
          rankings: res.data,
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

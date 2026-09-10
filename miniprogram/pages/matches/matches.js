const db = wx.cloud.database();
const { fetchAll } = require('../../utils/db');

Page({
  data: {
    currentTab: 0,
    tabs: ['比赛项目', '比赛结果'],
    matchItems: [],
    matches: [],
    loading: true
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    this.loadMatchItems();
    this.loadMatches();
  },

  loadMatchItems: function () {
    fetchAll(db, 'match_items', { orderBy: 'createTime' })
      .then(list => {
        this.setData({
          matchItems: list,
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('加载比赛项目失败', err);
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
  },

  loadMatches: function () {
    fetchAll(db, 'matches', { orderBy: 'matchTime' })
      .then(list => {
        this.setData({ matches: list });
      })
      .catch(err => {
        console.error('加载比赛结果失败', err);
      });
  },

  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  onSwiperChange: function (e) {
    const index = e.detail.current;
    this.setData({ currentTab: index });
  },

  goToMatchDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match-detail/match-detail?id=${id}`
    });
  },

  onPullDownRefresh: function () {
    this.loadData();
  },

  onShareAppMessage: function () {
    return {
      title: '羽毛球比赛 · 赛程与成绩查询',
      path: '/pages/matches/matches'
    };
  },

  onShareTimeline: function () {
    return { title: '羽毛球比赛 · 赛程与成绩查询' };
  }
});

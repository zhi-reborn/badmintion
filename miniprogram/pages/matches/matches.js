const app = getApp();
const db = wx.cloud.database();

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
    db.collection('match_items')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          matchItems: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载比赛项目失败', err);
        this.setData({ loading: false });
      });
  },

  loadMatches: function () {
    db.collection('matches')
      .orderBy('matchTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          matches: res.data
        });
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
    wx.stopPullDownRefresh();
  }
});

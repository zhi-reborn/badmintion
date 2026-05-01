const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    currentTab: 0,
    matchItems: [],
    matches: [],
    userInfo: null,
    loading: true
  },

  onLoad: function () {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo: userInfo });
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    this.setData({ loading: true });
    app.getUserOpenId(openid => {
      if (!openid) {
        this.setData({ loading: false });
        return;
      }
      this.loadMyMatchItems(openid);
      this.loadMyMatches(openid);
    });
  },

  loadMyMatchItems: function (openid) {
    db.collection('match_registrations').where({
      _openid: openid
    }).get().then(res => {
      const registrationIds = res.data.map(r => r.matchItemId);
      
      if (registrationIds.length === 0) {
        this.setData({
          matchItems: [],
          loading: false
        });
        return;
      }

      db.collection('match_items').where({
        _id: _.in(registrationIds)
      }).orderBy('createTime', 'desc').get().then(itemRes => {
        this.setData({
          matchItems: itemRes.data,
          loading: false
        });
      }).catch(err => {
        console.error('加载比赛项目失败', err);
        this.setData({ loading: false });
      });
    }).catch(err => {
      console.error('加载报名记录失败', err);
      this.setData({ loading: false });
    });
  },

  loadMyMatches: function (openid) {
    db.collection('matches').where(
      _.or([
        { player1Openid: openid },
        { player2Openid: openid }
      ])
    ).orderBy('matchTime', 'desc').get().then(res => {
      this.setData({
        matches: res.data
      });
    }).catch(err => {
      console.error('加载比赛记录失败', err);
    });
  },

  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
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
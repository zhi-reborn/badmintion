const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    itemId: '',
    itemInfo: null,
    players: [],
    schedules: [],
    results: [],
    currentTab: 0,
    tabs: ['参赛选手', '赛程安排', '比赛结果'],
    loading: true
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadItemInfo();
    }
  },

  loadItemInfo: function () {
    db.collection('match_items').doc(this.data.itemId).get().then(res => {
      if (res.data) {
        this.setData({
          itemInfo: res.data,
          loading: false
        });
        wx.setNavigationBarTitle({
          title: res.data.name || '比赛详情'
        });
        this.loadPlayers(res.data.name);
        this.loadSchedules();
        this.loadResults();
      }
    }).catch(err => {
      console.error('加载比赛项目失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  loadPlayers: function (itemName) {
    if (!itemName) return;
    
    db.collection('registrations').where({
      items: _.in([itemName])
    }).get().then(res => {
      console.log('加载参赛选手成功', res.data.length);
      this.setData({ players: res.data });
    }).catch(err => {
      console.error('加载参赛选手失败', err);
    });
  },

  loadSchedules: function () {
    db.collection('schedules').where({
      itemId: this.data.itemId
    }).orderBy('createTime', 'desc').get().then(res => {
      console.log('加载赛程成功', res.data.length);
      this.setData({ schedules: res.data });
    }).catch(err => {
      console.error('加载赛程失败', err);
    });
  },

  loadResults: function () {
    db.collection('matches').where({
      itemId: this.data.itemId
    }).orderBy('createTime', 'desc').get().then(res => {
      console.log('加载比赛结果成功', res.data.length);
      this.setData({ results: res.data });
    }).catch(err => {
      console.error('加载比赛结果失败', err);
    });
  },

  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  onSwiperChange: function (e) {
    this.setData({ currentTab: e.detail.current });
  },

  onPullDownRefresh: function () {
    this.loadItemInfo();
    wx.stopPullDownRefresh();
  }
});

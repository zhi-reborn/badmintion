const db = wx.cloud.database();
const _ = db.command;
const { fetchAll } = require('../../utils/db');

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
    } else {
      this.setData({ loading: false });
      wx.showToast({
        title: '缺少比赛项目参数',
        icon: 'none'
      });
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

    fetchAll(db, 'registrations', { where: { items: _.in([itemName]) }, orderBy: 'createTime' }).then(list => {
      this.setData({ players: list });
    }).catch(err => {
      console.error('加载参赛选手失败', err);
    });
  },

  loadSchedules: function () {
    fetchAll(db, 'schedules', { where: { itemId: this.data.itemId }, orderBy: 'createTime' }).then(list => {
      this.setData({ schedules: list });
    }).catch(err => {
      console.error('加载赛程失败', err);
    });
  },

  loadResults: function () {
    fetchAll(db, 'matches', { where: { itemId: this.data.itemId }, orderBy: 'matchTime' }).then(list => {
      this.setData({ results: list });
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载比赛结果失败', err);
      wx.stopPullDownRefresh();
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
  }
});

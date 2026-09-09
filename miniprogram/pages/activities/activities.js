const db = wx.cloud.database();
const _ = db.command;
const { fetchAll, attachRealRegistrationCounts } = require('../../utils/db');

Page({
  data: {
    activities: [],
    loading: true,
    currentType: '全部',
    types: ['全部', '比赛', '约球', '训练']
  },

  onLoad: function () {
    this.loadActivities();
  },

  onShow: function () {
    this.loadActivities();
  },

  loadActivities: function () {
    this.setData({ loading: true });
    
    let condition = {
      status: _.in(['报名中', '进行中'])
    };
    
    if (this.data.currentType !== '全部') {
      condition.type = this.data.currentType;
    }
    
    fetchAll(db, 'activities', {
      where: condition,
      orderBy: 'createTime'
    })
      .then(list => attachRealRegistrationCounts(db, list))
      .then(list => {
        this.setData({
          activities: list,
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('加载活动失败', err);
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  onTypeChange: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.loadActivities();
  },

  goToActivityDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    });
  },

  goToHome: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onPullDownRefresh: function () {
    this.loadActivities();
    wx.stopPullDownRefresh();
  }
});

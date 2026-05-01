const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    venues: [],
    loading: true,
    currentType: 'all',
    types: ['全部', '室内', '室外']
  },

  onLoad: function () {
    this.loadVenues();
  },

  onShow: function () {
    this.loadVenues();
  },

  loadVenues: function () {
    db.collection('venues')
      .where({
        status: 'active'
      })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          venues: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载场地失败', err);
        this.setData({ loading: false });
      });
  },

  onTypeChange: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
  },

  goToVenueDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/venue-detail/venue-detail?id=${id}`
    });
  },

  goToHome: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onPullDownRefresh: function () {
    this.loadVenues();
    wx.stopPullDownRefresh();
  }
});

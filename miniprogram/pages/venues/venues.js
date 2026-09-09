const db = wx.cloud.database();
const { fetchAll } = require('../../utils/db');

Page({
  data: {
    venues: [],
    allVenues: [],
    loading: true,
    currentType: '全部',
    types: ['全部', '室内', '室外'],
    keyword: ''
  },

  onLoad: function () {
    this.loadVenues();
  },

  onShow: function () {
    this.loadVenues();
  },

  loadVenues: function () {
    fetchAll(db, 'venues', {
      where: { status: 'active' },
      orderBy: 'createTime'
    }).then(list => {
      this.setData({
        allVenues: list,
        loading: false
      });
      this.applyFilter();
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载场地失败', err);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    });
  },

  applyFilter: function () {
    const { allVenues, currentType, keyword } = this.data;
    const kw = String(keyword || '').trim();
    const venues = allVenues.filter(v => {
      const typeOk = currentType === '全部' || v.type === currentType;
      const kwOk = !kw ||
        String(v.name || '').indexOf(kw) >= 0 ||
        String(v.address || '').indexOf(kw) >= 0;
      return typeOk && kwOk;
    });
    this.setData({ venues });
  },

  onTypeChange: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type });
    this.applyFilter();
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value });
    this.applyFilter();
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
  }
});

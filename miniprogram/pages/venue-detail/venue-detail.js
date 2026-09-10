const db = wx.cloud.database();

Page({
  data: {
    venue: null,
    loading: true
  },

  onLoad: function (options) {
    this.venueId = options.id || '';
    this.loadVenue();
  },

  loadVenue: function () {
    if (!this.venueId) {
      this.setData({ loading: false });
      return;
    }
    db.collection('venues').doc(this.venueId).get()
      .then(res => {
        this.setData({ venue: res.data, loading: false });
        wx.setNavigationBarTitle({ title: res.data.name || '场地详情' });
      })
      .catch(err => {
        console.error('加载场地详情失败', err);
        this.setData({ loading: false });
        wx.showToast({ title: '场地不存在或已下架', icon: 'none' });
      });
  },

  copyAddress: function () {
    const address = this.data.venue && this.data.venue.address;
    if (!address) {
      wx.showToast({ title: '暂无地址信息', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: address,
      success: () => wx.showToast({ title: '地址已复制', icon: 'success' })
    });
  },

  bookVenue: function () {
    wx.showModal({
      title: '预订咨询',
      content: '场地预订请通过协会管理员确认档期与费用',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  onShareAppMessage: function () {
    const venue = this.data.venue || {};
    return {
      title: venue.name || '场地详情',
      path: '/pages/venue-detail/venue-detail?id=' + this.venueId
    };
  },

  onShareTimeline: function () {
    const venue = this.data.venue || {};
    return {
      title: venue.name || '场地详情',
      query: 'id=' + this.venueId
    };
  }
});

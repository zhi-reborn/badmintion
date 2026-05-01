const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    activities: [],
    loading: true
  },

  onLoad: function () {
    this.loadMyActivities();
  },

  onShow: function () {
    this.loadMyActivities();
  },

  loadMyActivities: function () {
    this.setData({ loading: true });
    
    app.getUserOpenId(openid => {
      if (!openid) {
        this.setData({ loading: false });
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      db.collection('registrations').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length === 0) {
          this.setData({
            activities: [],
            loading: false
          });
          return;
        }

        const registration = res.data[0];
        const activityIds = registration.activityIds || [];
        
        if (activityIds.length === 0) {
          this.setData({
            activities: [],
            loading: false
          });
          return;
        }

        db.collection('activities').where({
          _id: _.in(activityIds)
        }).orderBy('createTime', 'desc').get().then(actRes => {
          const activities = actRes.data.map(act => ({
            ...act,
            registerTime: this.formatTime(registration.createTime)
          }));
          this.setData({
            activities: activities,
            loading: false
          });
        }).catch(err => {
          console.error('加载活动详情失败', err);
          this.setData({ loading: false });
        });
      }).catch(err => {
        console.error('加载报名记录失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
    });
  },

  formatTime: function (date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  goToActivityDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/activity-detail/activity-detail?id=${id}`
      });
    }
  },

  onPullDownRefresh: function () {
    this.loadMyActivities();
    wx.stopPullDownRefresh();
  }
});
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const { attachRealRegistrationCounts } = require('../../utils/db');

Page({
  data: {
    activities: [],
    loading: true
  },

  onLoad: function () {
    this.loadFavorites();
  },

  onShow: function () {
    this.loadFavorites();
  },

  loadFavorites: function () {
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

      db.collection('favorites').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length === 0) {
          this.setData({
            activities: [],
            loading: false
          });
          wx.stopPullDownRefresh();
          return;
        }

        const favorite = res.data[0];
        const activityIds = favorite.activityIds || [];

        if (activityIds.length === 0) {
          this.setData({
            activities: [],
            loading: false
          });
          wx.stopPullDownRefresh();
          return;
        }

        db.collection('activities').where({
          _id: _.in(activityIds)
        }).orderBy('createTime', 'desc').get().then(actRes => {
          return attachRealRegistrationCounts(db, actRes.data);
        }).then(activities => {
          this.setData({
            activities: activities,
            loading: false
          });
          wx.stopPullDownRefresh();
        }).catch(err => {
          console.error('加载活动详情失败', err);
          this.setData({ loading: false });
          wx.stopPullDownRefresh();
        });
      }).catch(err => {
        console.error('加载收藏记录失败', err);
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
    });
  },

  goToActivityDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/activity-detail/activity-detail?id=${id}`
    });
  },

  unfavorite: function (e) {
    const activityId = e.currentTarget.dataset.id;
    
    app.getUserOpenId(openid => {
      if (!openid) return;

      db.collection('favorites').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length > 0) {
          const favorite = res.data[0];
          const activity = this.data.activities.find(a => a._id === activityId);
          const activityTitle = activity ? activity.title : null;
          const newActivityIds = (favorite.activityIds || []).filter(id => id !== activityId);
          const newActivityNames = activityTitle
            ? (favorite.activityNames || []).filter(name => name !== activityTitle)
            : (favorite.activityNames || []);

          if (newActivityIds.length === 0) {
            return db.collection('favorites').doc(favorite._id).remove();
          } else {
            return db.collection('favorites').doc(favorite._id).update({
              data: {
                activityIds: newActivityIds,
                activityNames: newActivityNames
              }
            });
          }
        }
      }).then(() => {
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
        this.loadFavorites();
      }).catch(err => {
        console.error('取消收藏失败', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    });
  },

  onPullDownRefresh: function () {
    this.loadFavorites();
  }
});
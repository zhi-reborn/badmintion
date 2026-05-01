const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    activity: null,
    loading: true,
    isRegistered: false,
    isFavorited: false,
    participants: [],
    checkingStatus: true
  },

  onLoad: function (options) {
    if (options.id) {
      this.loadActivity(options.id);
    }
  },

  loadActivity: function (id) {
    Promise.all([
      db.collection('activities').doc(id).get(),
      this.checkRegistrationStatus(id),
      this.checkFavoriteStatus(id),
      this.loadParticipantsData(id)
    ]).then(([activityRes]) => {
      this.setData({
        activity: activityRes.data,
        loading: false,
        checkingStatus: false
      });
      wx.setNavigationBarTitle({
        title: activityRes.data.title || '活动详情'
      });
    }).catch(err => {
      console.error('加载活动失败', err);
      this.setData({ loading: false, checkingStatus: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  checkRegistrationStatus: function (activityId) {
    return new Promise((resolve) => {
      app.getUserOpenId(openid => {
        if (!openid) {
          this.setData({ isRegistered: false });
          resolve(false);
          return;
        }
        
        db.collection('registrations').where({
          _openid: openid
        }).get().then(res => {
          if (res.data.length > 0) {
            const registration = res.data[0];
            const activityIds = registration.activityIds || [];
            const isRegistered = activityIds.includes(activityId);
            this.setData({ isRegistered: isRegistered });
            resolve(isRegistered);
          } else {
            this.setData({ isRegistered: false });
            resolve(false);
          }
        }).catch(err => {
          console.error('检查报名状态失败', err);
          this.setData({ isRegistered: false });
          resolve(false);
        });
      });
    });
  },

  checkFavoriteStatus: function (activityId) {
    return new Promise((resolve) => {
      app.getUserOpenId(openid => {
        if (!openid) {
          resolve(false);
          return;
        }
        
        db.collection('favorites').where({
          _openid: openid
        }).get().then(res => {
          if (res.data.length > 0) {
            const favorite = res.data[0];
            const activityIds = favorite.activityIds || [];
            const isFavorited = activityIds.includes(activityId);
            this.setData({ isFavorited: isFavorited });
            resolve(isFavorited);
          } else {
            this.setData({ isFavorited: false });
            resolve(false);
          }
        }).catch(err => {
          console.error('检查收藏状态失败', err);
          resolve(false);
        });
      });
    });
  },

  loadParticipantsData: function (activityId) {
    return new Promise((resolve) => {
      db.collection('registrations').where({
        activityIds: _.in([activityId])
      }).orderBy('createTime', 'desc').get().then(res => {
        console.log('加载报名人员成功', res.data.length);
        this.setData({ participants: res.data });
        resolve(res.data);
      }).catch(err => {
        console.error('加载报名人员失败', err);
        resolve([]);
      });
    });
  },

  checkRegistration: function () {
  },

  loadParticipants: function () {
    if (!this.data.activity) return;
    db.collection('registrations').where({
      activityIds: _.in([this.data.activity._id])
    }).orderBy('createTime', 'desc').get().then(res => {
      console.log('加载报名人员成功', res.data.length);
      this.setData({ participants: res.data });
    }).catch(err => {
      console.error('加载报名人员失败', err);
    });
  },

  registerActivity: function () {
    if (this.data.isRegistered) {
      wx.showToast({ title: '您已报名此活动', icon: 'none' });
      return;
    }

    if (this.data.activity.maxCount && this.data.participants.length >= this.data.activity.maxCount) {
      wx.showToast({ title: '名额已满', icon: 'none' });
      return;
    }

    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '请先登录',
        content: '您还未登录，是否现在去登录？',
        confirmText: '去登录',
        success: modalRes => {
          if (modalRes.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    app.getUserOpenId(openid => {
      if (!openid) {
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        return;
      }

      db.collection('registrations').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length > 0) {
          const registration = res.data[0];
          const activityIds = registration.activityIds || [];
          const activityNames = registration.activityNames || [];
          
          if (activityIds.includes(this.data.activity._id)) {
            wx.showToast({ title: '您已报名此活动', icon: 'none' });
            this.setData({ isRegistered: true });
            return;
          }

          activityIds.push(this.data.activity._id);
          activityNames.push(this.data.activity.title);

          wx.showModal({
            title: '确认报名',
            content: `确定要报名"${this.data.activity.title}"吗？将使用您之前的信息：${registration.name}、${registration.phone}`,
            success: modalRes => {
              if (modalRes.confirm) {
                this.doRegister(registration._id, activityIds, activityNames);
              }
            }
          });
        } else {
          wx.showModal({
            title: '需要完善报名信息',
            content: '您还未填写过报名信息，是否现在去填写？',
            confirmText: '去填写',
            success: modalRes => {
              if (modalRes.confirm) {
                wx.navigateTo({
                  url: '/pages/register/register'
                });
              }
            }
          });
        }
      }).catch(err => {
        console.error('检查报名记录失败', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    });
  },

  doRegister: function (registrationId, activityIds, activityNames) {
    wx.showLoading({ title: '报名中...' });

    db.collection('registrations').doc(registrationId).update({
      data: {
        activityIds: activityIds,
        activityNames: activityNames
      }
    }).then(() => {
      this.updateActivityCount(true);
      wx.hideLoading();
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });
      this.setData({ isRegistered: true });
      setTimeout(() => {
        this.loadParticipants();
      }, 500);
    }).catch(err => {
      wx.hideLoading();
      console.error('报名失败', err);
      wx.showToast({
        title: '报名失败',
        icon: 'none'
      });
    });
  },

  updateActivityCount: function (isAdd) {
    const currentCount = Math.max(0, (this.data.activity.currentCount || 0) + (isAdd ? 1 : -1));
    db.collection('activities').doc(this.data.activity._id).update({
      data: { currentCount: currentCount }
    });
    this.setData({
      'activity.currentCount': currentCount
    });
  },

  cancelRegistration: function () {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      success: res => {
        if (res.confirm) {
          app.getUserOpenId(openid => {
            if (!openid) return;
            
            db.collection('registrations').where({
              _openid: openid
            }).get().then(res => {
              if (res.data.length > 0) {
                const registration = res.data[0];
                const activityIds = registration.activityIds || [];
                const activityNames = registration.activityNames || [];
                
                if (!activityIds.includes(this.data.activity._id)) {
                  wx.showToast({ title: '您未报名此活动', icon: 'none' });
                  this.setData({ isRegistered: false });
                  return;
                }

                const newActivityIds = activityIds.filter(id => id !== this.data.activity._id);
                const newActivityNames = activityNames.filter(name => name !== this.data.activity.title);
                
                if (newActivityIds.length === 0) {
                  db.collection('registrations').doc(registration._id).remove().then(() => {
                    wx.showToast({ title: '已取消报名', icon: 'success' });
                    this.setData({ isRegistered: false });
                    this.updateActivityCount(false);
                    setTimeout(() => {
                      this.loadParticipants();
                    }, 500);
                  });
                } else {
                  db.collection('registrations').doc(registration._id).update({
                    data: {
                      activityIds: newActivityIds,
                      activityNames: newActivityNames
                    }
                  }).then(() => {
                    wx.showToast({ title: '已取消报名', icon: 'success' });
                    this.setData({ isRegistered: false });
                    this.updateActivityCount(false);
                    setTimeout(() => {
                      this.loadParticipants();
                    }, 500);
                  });
                }
              }
            });
          });
        }
      }
    });
  },

  toggleFavorite: function () {
    app.getUserOpenId(openid => {
      if (!openid) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      const activityId = this.data.activity._id;
      const activityTitle = this.data.activity.title;

      db.collection('favorites').where({
        _openid: openid
      }).get().then(res => {
        if (res.data.length === 0) {
          return db.collection('favorites').add({
            data: {
              activityIds: [activityId],
              activityNames: [activityTitle],
              createTime: db.serverDate()
            }
          });
        } else {
          const favorite = res.data[0];
          const activityIds = favorite.activityIds || [];
          const activityNames = favorite.activityNames || [];
          
          if (this.data.isFavorited) {
            const newActivityIds = activityIds.filter(id => id !== activityId);
            const newActivityNames = activityNames.filter(name => name !== activityTitle);
            
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
          } else {
            activityIds.push(activityId);
            activityNames.push(activityTitle);
            return db.collection('favorites').doc(favorite._id).update({
              data: {
                activityIds: activityIds,
                activityNames: activityNames
              }
            });
          }
        }
      }).then(() => {
        this.setData({
          isFavorited: !this.data.isFavorited
        });
        wx.showToast({
          title: this.data.isFavorited ? '已收藏' : '已取消收藏',
          icon: 'success'
        });
      }).catch(err => {
        console.error('收藏操作失败', err);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    });
  },

  onPullDownRefresh: function () {
    if (this.data.activity) {
      this.loadActivity(this.data.activity._id);
    }
    wx.stopPullDownRefresh();
  }
});

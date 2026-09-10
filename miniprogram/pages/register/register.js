const app = getApp();
const db = wx.cloud.database();
const { fetchAll, attachRealRegistrationCounts } = require('../../utils/db');
const {
  filterRegistrationsForLogin,
  getRegistrationForActivity,
  buildActivitySelection
} = require('../../utils/registration-flow');

Page({
  data: {
    formData: {
      name: '',
      department: '',
      gender: '男',
      skillLevel: '中级',
      items: [],
      activityIds: [],
      activityNames: []
    },
    genderOptions: ['男', '女'],
    skillOptions: ['初级', '中级', '高级', '专业'],
    skillIndex: 1,
    matchItems: [
      { id: 'team', name: '团体赛', checked: false },
      { id: 'fun', name: '趣味赛', checked: false }
    ],
    selectedItems: [],
    activities: [],
    selectedActivities: [],
    myRegistrations: [],
    presetActivityId: '',
    presetActivityName: ''
  },

  onLoad: function (options = {}) {
    if (options.activityId) {
      const activityId = decodeURIComponent(options.activityId);
      const activityName = decodeURIComponent(options.activityName || '');

      this.setData({
        presetActivityId: activityId,
        presetActivityName: activityName,
        selectedActivities: [activityId],
        'formData.activityIds': [activityId],
        'formData.activityNames': activityName ? [activityName] : []
      });
    }
  },

  onShow: function () {
    this.loadActivities();
    this.loadMyRegistrations();
  },

  loadActivities: function () {
    const that = this;
    fetchAll(db, 'activities', { orderBy: 'createTime' })
      .then(list => {
        const activeList = list.filter(item =>
          item.status === '报名中' || item.status === '进行中'
        );
        return attachRealRegistrationCounts(db, activeList);
      })
      .then(activities => {
        const selectedIds = that.data.formData.activityIds || [];
        const selectedActivities = buildActivitySelection(activities, selectedIds);
        const selectedActivityNames = selectedActivities
          .filter(item => item.checked)
          .map(item => item.title);

        that.setData({
          activities: selectedActivities,
          'formData.activityNames': selectedActivityNames.length > 0
            ? selectedActivityNames
            : that.data.formData.activityNames
        });
      })
      .catch(err => {
        console.error('加载活动列表失败', err);
        wx.showToast({
          title: '加载活动失败',
          icon: 'none'
        });
      });
  },

  loadMyRegistrations: function () {
    if (!app.isLoggedIn()) {
      this.setData({ myRegistrations: [] });
      return;
    }

    app.getUserOpenId(openid => {
      if (!openid) return;

      fetchAll(db, 'registrations', { where: { _openid: openid }, orderBy: 'createTime' }).then(list => {
        this.setData({
          myRegistrations: filterRegistrationsForLogin(list, app.getLoginInfo())
        });
      }).catch(err => {
        console.error('加载我的报名记录失败', err);
      });
    });
  },

  onInputChange: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onGenderTap: function (e) {
    this.setData({
      'formData.gender': e.currentTarget.dataset.gender
    });
  },

  onSkillChange: function (e) {
    const index = e.detail.value;
    this.setData({
      skillIndex: index,
      'formData.skillLevel': this.data.skillOptions[index]
    });
  },

  toggleMatchItem: function (e) {
    const id = e.currentTarget.dataset.id;
    const matchItems = this.data.matchItems.map(item => {
      if (item.id === id) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });
    
    const selectedItems = matchItems.filter(item => item.checked).map(item => item.name);
    
    this.setData({
      matchItems: matchItems,
      selectedItems: selectedItems,
      'formData.items': selectedItems
    });
  },

  onActivityChange: function (e) {
    const selectedIds = e.detail.value || [];
    const activities = this.data.activities;
    const selectedActivityNames = activities
      .filter(a => selectedIds.indexOf(a._id) >= 0)
      .map(a => a.title);
    const nextActivities = buildActivitySelection(activities, selectedIds);

    this.setData({
      selectedActivities: selectedIds,
      activities: nextActivities,
      'formData.activityIds': selectedIds,
      'formData.activityNames': selectedActivityNames
    });
  },

  resetForm: function () {
    this.setData({
      formData: {
        name: '',
        department: '',
        gender: '男',
        skillLevel: '中级',
        items: [],
        activityIds: [],
        activityNames: []
      },
      skillIndex: 1,
      matchItems: this.data.matchItems.map(item => ({ ...item, checked: false })),
      selectedItems: [],
      selectedActivities: [],
      activities: buildActivitySelection(this.data.activities, [])
    });
  },

  hasDuplicateRegistration: function (activityIds) {
    return activityIds.some(activityId => getRegistrationForActivity(this.data.myRegistrations, activityId));
  },

  validateForm: function () {
    const { name, gender, activityIds } = this.data.formData;

    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return false;
    }

    if (!activityIds || activityIds.length === 0) {
      wx.showToast({ title: '请至少选择一个活动', icon: 'none' });
      return false;
    }
    if (this.hasDuplicateRegistration(activityIds)) {
      wx.showToast({ title: '已报名过所选活动', icon: 'none' });
      return false;
    }

    return true;
  },

  submitRegistration: function () {
    if (!this.validateForm()) {
      return;
    }

    wx.showLoading({ title: '提交中...' });

    const selectedItems = this.data.matchItems
      .filter(item => item.checked)
      .map(item => item.name);

    const registrationData = {
      name: this.data.formData.name,
      userKey: app.getCurrentUserKey(),
      loginName: (app.getLoginInfo() && app.getLoginInfo().nickName) || '',
      department: this.data.formData.department,
      gender: this.data.formData.gender,
      skillLevel: this.data.formData.skillLevel,
      items: selectedItems,
      activityIds: this.data.formData.activityIds,
      activityNames: this.data.formData.activityNames,
      createTime: db.serverDate()
    };

    db.collection('registrations').add({
      data: registrationData
    }).then(res => {
      wx.hideLoading();
      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '报名失败，请重试',
        icon: 'none'
      });
      console.error('报名失败', err);
    });
  },

  cancelForm: function () {
    wx.showModal({
      title: '确认取消',
      content: '确定要放弃填写报名信息吗？',
      success: res => {
        if (res.confirm) {
          this.resetForm();
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }
    });
  },

  cancelRegistration: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这条报名记录吗？',
      success: res => {
        if (res.confirm) {
          db.collection('registrations').doc(id).remove().then(() => {
            wx.showToast({
              title: '已取消报名',
              icon: 'success'
            });

            this.loadMyRegistrations();
          }).catch(err => {
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          });
        }
      }
    });
  }
});

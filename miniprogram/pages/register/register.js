const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const {
  filterRegistrationsForLogin,
  getRegistrationForActivity,
  buildActivitySelection
} = require('../../utils/registration-flow');

Page({
  data: {
    formData: {
      name: '',
      phone: '',
      department: '',
      gender: '男',
      skillLevel: '中级',
      items: [],
      activityIds: [],
      activityNames: []
    },
    genderOptions: ['男', '女'],
    genderIndex: 0,
    skillOptions: ['初级', '中级', '高级', '专业'],
    skillIndex: 1,
    matchItems: [
      { id: 'male_single', name: '男单', checked: false },
      { id: 'female_single', name: '女单', checked: false },
      { id: 'male_double', name: '男双', checked: false },
      { id: 'female_double', name: '女双', checked: false },
      { id: 'mixed_double', name: '混双', checked: false }
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

    this.loadActivities();
    this.loadMyRegistrations();
  },

  onShow: function () {
    this.loadActivities();
    this.loadMyRegistrations();
  },

  loadActivities: function () {
    const that = this;
    db.collection('activities')
      .get()
      .then(res => {
        console.log('所有活动:', res.data);
        const activities = res.data.filter(item => 
          item.status === '报名中' || item.status === '进行中'
        );
        const selectedIds = that.data.formData.activityIds || [];
        const selectedActivities = buildActivitySelection(activities, selectedIds);
        const selectedActivityNames = selectedActivities
          .filter(item => item.checked)
          .map(item => item.title);

        console.log('可报名活动:', selectedActivities.length, selectedActivities);
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
      
      db.collection('registrations').where({
        _openid: openid
      }).orderBy('createTime', 'desc').get().then(res => {
        this.setData({
          myRegistrations: filterRegistrationsForLogin(res.data, app.getLoginInfo())
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

  onGenderChange: function (e) {
    const index = e.detail.value;
    this.setData({
      genderIndex: index,
      'formData.gender': this.data.genderOptions[index]
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
    console.log('活动选择变化:', e.detail.value);
    const selectedIds = e.detail.value || [];
    const activities = this.data.activities;
    const selectedActivities = selectedIds;
    const selectedActivityNames = activities
      .filter(a => selectedIds.indexOf(a._id) >= 0)
      .map(a => a.title);
    const nextActivities = buildActivitySelection(activities, selectedIds);
    
    console.log('选中的活动ID:', selectedIds);
    console.log('选中的活动名称:', selectedActivityNames);
    
    this.setData({
      selectedActivities: selectedActivities,
      activities: nextActivities,
      'formData.activityIds': selectedIds,
      'formData.activityNames': selectedActivityNames
    });
  },

  resetForm: function () {
    this.setData({
      formData: {
        name: '',
        phone: '',
        department: '',
        gender: '男',
        skillLevel: '中级',
        items: [],
        activityIds: [],
        activityNames: []
      },
      genderIndex: 0,
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
    const { name, phone, department, gender, activityIds } = this.data.formData;
    
    if (!name || !name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!phone || !phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }
    if (!department || !department.trim()) {
      wx.showToast({ title: '请输入部门', icon: 'none' });
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
      phone: this.data.formData.phone,
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
      
      this.updateActivityCount(this.data.formData.activityIds);
      
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

  updateActivityCount: function (activityIds) {
    if (!activityIds || activityIds.length === 0) return;
    
    activityIds.forEach(activityId => {
      db.collection('activities').doc(activityId).get().then(res => {
        if (res.data) {
          const currentCount = (res.data.currentCount || 0) + 1;
          db.collection('activities').doc(activityId).update({
            data: { currentCount: currentCount }
          });
        }
      });
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
          const registration = this.data.myRegistrations.find(r => r._id === id);
          
          db.collection('registrations').doc(id).remove().then(() => {
            wx.showToast({
              title: '已取消报名',
              icon: 'success'
            });
            
            if (registration && registration.activityIds) {
              registration.activityIds.forEach(activityId => {
                db.collection('activities').doc(activityId).get().then(res => {
                  if (res.data && res.data.currentCount > 0) {
                    db.collection('activities').doc(activityId).update({
                      data: { currentCount: res.data.currentCount - 1 }
                    });
                  }
                });
              });
            }
            
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

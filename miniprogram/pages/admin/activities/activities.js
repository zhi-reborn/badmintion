const db = wx.cloud.database();
const { fetchAll, attachRealRegistrationCounts } = require('../../../utils/db');

Page({
  data: {
    activities: [],
    loading: true,
    showAddModal: false,
    editMode: false,
    editId: '',
    formData: {
      title: '',
      type: '比赛',
      status: '报名中',
      venue: '',
      time: '',
      maxCount: 20,
      fee: 0,
      description: '',
      groups: ''
    },
    typeOptions: ['比赛', '约球', '训练'],
    typeIndex: 0,
    statusOptions: ['报名中', '进行中', '已结束'],
    statusIndex: 0
  },

  onLoad: function () {
    this.loadActivities();
  },

  onShow: function () {
    this.loadActivities();
  },

  loadActivities: function () {
    this.setData({ loading: true });
    
    fetchAll(db, 'activities', { orderBy: 'createTime' })
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
        wx.showModal({
          title: '提示',
          content: 'activities 集合不存在，请先在云开发控制台创建该集合',
          showCancel: false
        });
      });
  },

  showAddModal: function () {
    this.setData({
      showAddModal: true,
      editMode: false,
      editId: '',
      formData: {
        title: '',
        type: '比赛',
        status: '报名中',
        venue: '',
        time: '',
        maxCount: 20,
        fee: 0,
        description: '',
        groups: ''
      },
      typeIndex: 0,
      statusIndex: 0
    });
  },

  editActivity: function (e) {
    const id = e.currentTarget.dataset.id;
    const activity = this.data.activities.find(a => a._id === id);
    
    if (activity) {
      this.setData({
        showAddModal: true,
        editMode: true,
        editId: id,
        formData: {
          title: activity.title,
          type: activity.type,
          status: activity.status,
          venue: activity.venue || '',
          time: activity.time || '',
          maxCount: activity.maxCount || 20,
          fee: activity.fee || 0,
          description: activity.description || '',
          groups: activity.groups || ''
        },
        typeIndex: this.data.typeOptions.indexOf(activity.type),
        statusIndex: this.data.statusOptions.indexOf(activity.status)
      });
    }
  },

  closeModal: function () {
    this.setData({ showAddModal: false });
  },

  onInputChange: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  onTypeChange: function (e) {
    const index = e.detail.value;
    this.setData({
      typeIndex: index,
      'formData.type': this.data.typeOptions[index]
    });
  },

  onStatusChange: function (e) {
    const index = e.detail.value;
    this.setData({
      statusIndex: index,
      'formData.status': this.data.statusOptions[index]
    });
  },

  saveActivity: function () {
    const { formData, editMode, editId } = this.data;
    
    if (!formData.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    if (editMode) {
      db.collection('activities').doc(editId).update({
        data: {
          ...formData,
          updateTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '修改成功', icon: 'success' });
        this.closeModal();
        this.loadActivities();
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '修改失败', icon: 'none' });
      });
    } else {
      db.collection('activities').add({
        data: {
          ...formData,
          currentCount: 0,
          createTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.closeModal();
        this.loadActivities();
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '添加失败', icon: 'none' });
      });
    }
  },

  deleteActivity: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个活动吗？',
      success: res => {
        if (res.confirm) {
          db.collection('activities').doc(id).remove().then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadActivities();
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onPullDownRefresh: function () {
    this.loadActivities();
  },

  stopPropagation: function () {
  }
});

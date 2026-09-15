const db = wx.cloud.database();
const { fetchAll } = require('../../../utils/db');

Page({
  data: {
    players: [],
    loading: true,
    editingPlayer: null,
    skillOptions: ['初级', '中级', '高级', '专业'],
    skillIndex: 0,
    showEditModal: false
  },

  onLoad: function () {
    this.loadPlayers();
  },

  onShow: function () {
    this.loadPlayers();
  },

  loadPlayers: function () {
    this.setData({ loading: true });
    
    fetchAll(db, 'registrations', { orderBy: 'createTime' })
      .then(list => {
        this.setData({
          players: list,
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('加载选手列表失败', err);
        this.setData({ loading: false });
        wx.showModal({
          title: '加载失败',
          content: '请确保已创建 registrations 集合。错误：' + (err.errMsg || JSON.stringify(err)),
          showCancel: false
        });
      });
  },

  showEditDialog: function (e) {
    const player = e.currentTarget.dataset.player;
    const skillIndex = this.data.skillOptions.indexOf(player.skillLevel);
    
    this.setData({
      editingPlayer: player,
      skillIndex: skillIndex >= 0 ? skillIndex : 0,
      showEditModal: true
    });
  },

  onSkillChange: function (e) {
    this.setData({
      skillIndex: parseInt(e.detail.value)
    });
  },

  closeModal: function () {
    this.setData({
      showEditModal: false,
      editingPlayer: null
    });
  },

  saveSkill: function () {
    const { editingPlayer, skillOptions, skillIndex } = this.data;
    
    if (!editingPlayer) {
      wx.showToast({
        title: '请先选择选手',
        icon: 'none'
      });
      return;
    }

    const newSkill = skillOptions[skillIndex];

    wx.showLoading({ title: '保存中...' });

    db.collection('registrations').doc(editingPlayer._id).update({
      data: {
        skillLevel: newSkill
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      });
      
      this.closeModal();
      this.loadPlayers();
    }).catch(err => {
      wx.hideLoading();
      console.error('修改技术等级失败', err);
      wx.showModal({
        title: '修改失败',
        content: '错误: ' + (err.errMsg || JSON.stringify(err)) + '\n\n请检查数据库权限，registrations 集合需要设置为"所有用户可读写"。',
        showCancel: false
      });
    });
  },

  onPullDownRefresh: function () {
    this.loadPlayers();
  },

  deleteRegistration: function (e) {
    const player = e.currentTarget.dataset.player;
    const activityNames = (player.activityNames && player.activityNames.length)
      ? player.activityNames.join('、')
      : '无';
    const items = (player.items && player.items.length)
      ? player.items.join('、')
      : '无';

    wx.showModal({
      title: '删除报名',
      content: `确定删除「${player.name}」的整条报名记录吗？\n活动：${activityNames}\n参赛项目：${items}\n删除后不可恢复`,
      confirmText: '删除',
      confirmColor: '#e64340',
      success: res => {
        if (!res.confirm) return;

        wx.showLoading({ title: '删除中...' });
        db.collection('registrations').doc(player._id).remove().then(() => {
          wx.hideLoading();
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadPlayers();
        }).catch(err => {
          wx.hideLoading();
          console.error('删除报名失败', err);
          wx.showModal({
            title: '删除失败',
            content: '错误: ' + (err.errMsg || JSON.stringify(err)) + '\n\n请检查数据库权限，registrations 集合需要设置为"所有用户可读写"。',
            showCancel: false
          });
        });
      }
    });
  },

  stopPropagation: function () {
  }
});

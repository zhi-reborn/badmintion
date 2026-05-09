const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const {
  getDepartmentOptions,
  filterDepartmentOptions
} = require('../../../utils/ranking');

Page({
  data: {
    itemId: '',
    itemInfo: null,
    players: [],
    departmentOptions: [],
    resultFilteredDepartments1: [],
    resultFilteredDepartments2: [],
    showAddSchedule: false,
    showAddResult: false,
    scheduleForm: {
      round: '第1轮',
      team1: [],
      team2: [],
      matchTime: '',
      court: ''
    },
    resultForm: {
      round: '第1轮',
      team1: [],
      team2: [],
      team1Department: '',
      team2Department: '',
      score1: 0,
      score2: 0,
      winner: 1
    },
    roundOptions: ['第1轮', '第2轮', '第3轮', '第4轮', '半决赛', '决赛'],
    roundIndex: 0,
    schedules: [],
    results: [],
    team1Display: '',
    team2Display: '',
    resultTeam1Display: '',
    resultTeam2Display: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ itemId: options.id });
      this.loadData();
    }
  },

  loadData: function () {
    this.loadItemInfo();
  },

  loadItemInfo: function () {
    db.collection('match_items').doc(this.data.itemId).get().then(res => {
      this.setData({ itemInfo: res.data });
      wx.setNavigationBarTitle({
        title: '管理: ' + res.data.name
      });
      this.loadPlayers();
      this.loadSchedules();
      this.loadResults();
    }).catch(err => {
      console.error('加载比赛项目失败', err);
    });
  },

  loadPlayers: function () {
    if (!this.data.itemInfo) return;
    db.collection('registrations').where({
      items: _.in([this.data.itemInfo.name])
    }).get().then(res => {
      const departmentOptions = getDepartmentOptions(res.data);
      this.setData({
        players: res.data,
        departmentOptions: departmentOptions,
        resultFilteredDepartments1: departmentOptions,
        resultFilteredDepartments2: departmentOptions
      });
    }).catch(err => {
      console.error('加载参赛选手失败', err);
    });
  },

  loadSchedules: function () {
    db.collection('schedules').where({
      itemId: this.data.itemId
    }).orderBy('createTime', 'desc').get().then(res => {
      const schedules = res.data.map(item => ({
        ...item,
        team1Display: (item.team1 || []).map(p => p.name).join('、'),
        team2Display: (item.team2 || []).map(p => p.name).join('、')
      }));
      this.setData({ schedules: schedules });
    }).catch(err => {
      console.error('加载赛程失败', err);
    });
  },

  loadResults: function () {
    db.collection('matches').where({
      itemId: this.data.itemId
    }).orderBy('matchTime', 'desc').get().then(res => {
      const results = res.data.map(item => ({
        ...item,
        team1Display: (item.team1 || []).map(p => p.name).join('、'),
        team2Display: (item.team2 || []).map(p => p.name).join('、')
      }));
      this.setData({ results: results });
    }).catch(err => {
      console.error('加载比赛结果失败', err);
    });
  },

  onStatusChange: function (e) {
    const statusIndex = e.detail.value;
    const statusOptions = ['报名中', '进行中', '已结束'];
    const status = statusOptions[statusIndex];
    
    db.collection('match_items').doc(this.data.itemId).update({
      data: { status: status }
    }).then(() => {
      wx.showToast({ title: '状态已更新', icon: 'success' });
      this.loadItemInfo();
    }).catch(err => {
      wx.showToast({ title: '更新失败', icon: 'none' });
    });
  },

  showScheduleModal: function () {
    this.setData({
      showAddSchedule: true,
      scheduleForm: {
        round: '第1轮',
        team1: [],
        team2: [],
        matchTime: '',
        court: ''
      },
      roundIndex: 0,
      team1Display: '',
      team2Display: ''
    });
  },

  closeScheduleModal: function () {
    this.setData({ showAddSchedule: false });
  },

  onRoundChange: function (e) {
    const index = e.detail.value;
    this.setData({
      roundIndex: index,
      'scheduleForm.round': this.data.roundOptions[index]
    });
  },

  onMatchTimeInput: function (e) {
    this.setData({
      'scheduleForm.matchTime': e.detail.value
    });
  },

  onCourtInput: function (e) {
    this.setData({
      'scheduleForm.court': e.detail.value
    });
  },

  onTeam1Change: function (e) {
    const indices = e.detail.value;
    const selected = indices.map(i => this.data.players[i]);
    this.setData({
      'scheduleForm.team1': selected.map(p => ({ id: p._id, name: p.name })),
      team1Display: selected.map(p => p.name).join('、')
    });
  },

  onTeam2Change: function (e) {
    const indices = e.detail.value;
    const selected = indices.map(i => this.data.players[i]);
    this.setData({
      'scheduleForm.team2': selected.map(p => ({ id: p._id, name: p.name })),
      team2Display: selected.map(p => p.name).join('、')
    });
  },

  saveSchedule: function () {
    const { scheduleForm } = this.data;
    
    if (scheduleForm.team1.length === 0 || scheduleForm.team2.length === 0) {
      wx.showToast({ title: '请选择双方选手', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    db.collection('schedules').add({
      data: {
        ...scheduleForm,
        itemId: this.data.itemId,
        itemName: this.data.itemInfo.name,
        status: 'pending',
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.closeScheduleModal();
      this.loadSchedules();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    });
  },

  showResultModal: function () {
    this.setData({
      showAddResult: true,
      resultForm: {
        round: '第1轮',
        team1: [],
        team2: [],
        team1Department: '',
        team2Department: '',
        score1: 0,
        score2: 0,
        winner: 1
      },
      roundIndex: 0,
      resultTeam1Display: '',
      resultTeam2Display: '',
      resultFilteredDepartments1: this.data.departmentOptions,
      resultFilteredDepartments2: this.data.departmentOptions
    });
  },

  closeResultModal: function () {
    this.setData({ showAddResult: false });
  },

  onResultRoundChange: function (e) {
    const index = e.detail.value;
    this.setData({
      roundIndex: index,
      'resultForm.round': this.data.roundOptions[index]
    });
  },

  onResultTeam1Change: function (e) {
    const indices = e.detail.value;
    const selected = indices.map(i => this.data.players[i]);
    this.setData({
      'resultForm.team1': selected.map(p => ({ id: p._id, name: p.name })),
      resultTeam1Display: selected.map(p => p.name).join('、')
    });

    if (!this.data.resultForm.team1Department && selected[0] && selected[0].department) {
      this.setData({
        'resultForm.team1Department': selected[0].department,
        resultFilteredDepartments1: filterDepartmentOptions(this.data.departmentOptions, selected[0].department)
      });
    }
  },

  onResultTeam2Change: function (e) {
    const indices = e.detail.value;
    const selected = indices.map(i => this.data.players[i]);
    this.setData({
      'resultForm.team2': selected.map(p => ({ id: p._id, name: p.name })),
      resultTeam2Display: selected.map(p => p.name).join('、')
    });

    if (!this.data.resultForm.team2Department && selected[0] && selected[0].department) {
      this.setData({
        'resultForm.team2Department': selected[0].department,
        resultFilteredDepartments2: filterDepartmentOptions(this.data.departmentOptions, selected[0].department)
      });
    }
  },

  onResultTeam1DepartmentInput: function (e) {
    const value = e.detail.value;
    this.setData({
      'resultForm.team1Department': value,
      resultFilteredDepartments1: filterDepartmentOptions(this.data.departmentOptions, value)
    });
  },

  onResultTeam2DepartmentInput: function (e) {
    const value = e.detail.value;
    this.setData({
      'resultForm.team2Department': value,
      resultFilteredDepartments2: filterDepartmentOptions(this.data.departmentOptions, value)
    });
  },

  selectResultTeam1Department: function (e) {
    const department = e.currentTarget.dataset.department;
    this.setData({
      'resultForm.team1Department': department,
      resultFilteredDepartments1: filterDepartmentOptions(this.data.departmentOptions, department)
    });
  },

  selectResultTeam2Department: function (e) {
    const department = e.currentTarget.dataset.department;
    this.setData({
      'resultForm.team2Department': department,
      resultFilteredDepartments2: filterDepartmentOptions(this.data.departmentOptions, department)
    });
  },

  onScore1Input: function (e) {
    this.setData({
      'resultForm.score1': parseInt(e.detail.value) || 0
    });
  },

  onScore2Input: function (e) {
    this.setData({
      'resultForm.score2': parseInt(e.detail.value) || 0
    });
  },

  onWinnerChange: function (e) {
    this.setData({
      'resultForm.winner': parseInt(e.detail.value)
    });
  },

  saveResult: function () {
    const { resultForm } = this.data;
    
    if (resultForm.team1.length === 0 || resultForm.team2.length === 0) {
      wx.showToast({ title: '请选择双方选手', icon: 'none' });
      return;
    }

    if (!resultForm.team1Department.trim() || !resultForm.team2Department.trim()) {
      wx.showToast({ title: '请填写双方部门', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    db.collection('matches').add({
      data: {
        ...resultForm,
        itemId: this.data.itemId,
        itemName: this.data.itemInfo.name,
        matchTime: db.serverDate(),
        createTime: db.serverDate()
      }
    }).then(() => {
      this.updateDepartmentRankings(resultForm);
      wx.hideLoading();
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.closeResultModal();
      this.loadResults();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '添加失败', icon: 'none' });
    });
  },

  updateDepartmentRankings: function (match) {
    [
      { name: match.team1Department.trim(), isWinner: match.winner === 1 },
      { name: match.team2Department.trim(), isWinner: match.winner === 2 }
    ].forEach(department => {
      this.updateDepartmentRanking(department.name, department.isWinner);
    });
  },

  updateDepartmentRanking: function (departmentName, isWinner) {
    db.collection('department_rankings').where({
      departmentName: departmentName
    }).get().then(res => {
      if (res.data.length > 0) {
        const record = res.data[0];
        const updateData = {
          match: (record.match || 0) + 1,
          updateTime: db.serverDate()
        };

        if (isWinner) {
          updateData.win = (record.win || 0) + 1;
          updateData.total = (record.total || 0) + 1;
        }

        db.collection('department_rankings').doc(record._id).update({
          data: updateData
        });
      } else {
        db.collection('department_rankings').add({
          data: {
            departmentName: departmentName,
            total: isWinner ? 1 : 0,
            win: isWinner ? 1 : 0,
            match: 1,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }
    }).catch(err => {
      console.error('更新部门排名失败', err);
    });
  },

  deleteSchedule: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条赛程吗？',
      success: res => {
        if (res.confirm) {
          db.collection('schedules').doc(id).remove().then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadSchedules();
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  deleteResult: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条比赛结果吗？',
      success: res => {
        if (res.confirm) {
          db.collection('matches').doc(id).remove().then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadResults();
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  }
});

const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const {
  getDepartmentOptions,
  filterDepartmentOptions
} = require('../../../utils/ranking');

Page({
  data: {
    currentTab: 0,
    tabs: ['比赛项目', '录入结果'],
    matchItems: [],
    players: [],
    departmentOptions: [],
    filteredDepartments1: [],
    filteredDepartments2: [],
    matchResults: [],
    showAddItemModal: false,
    showAddMatchModal: false,
    newItem: {
      name: '',
      status: '报名中',
      description: ''
    },
    statusOptions: ['报名中', '进行中', '已结束'],
    statusIndex: 0,
    presetItems: ['男单', '女单', '男双', '女双', '混双'],
    newMatch: {
      itemId: '',
      itemName: '',
      team1: [],
      team2: [],
      team1Department: '',
      team2Department: '',
      score1: 0,
      score2: 0,
      winner: 1,
      round: '第1轮'
    },
    roundOptions: ['第1轮', '第2轮', '第3轮', '第4轮', '半决赛', '决赛'],
    roundIndex: 0,
    team1PlayerIds: [],
    team2PlayerIds: [],
    team1Players: [],
    team2Players: [],
    searchKeyword1: '',
    searchKeyword2: '',
    filteredPlayers1: [],
    filteredPlayers2: []
  },

  onLoad: function () {
    this.loadData();
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    this.loadMatchItems();
    this.loadPlayers();
    this.loadMatchResults();
  },

  loadMatchItems: function () {
    db.collection('match_items')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        console.log('加载比赛项目成功', res.data.length);
        this.setData({ matchItems: res.data });
      })
      .catch(err => {
        console.error('加载比赛项目失败', err);
      });
  },

  loadPlayers: function () {
    db.collection('registrations')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        console.log('加载选手列表成功', res.data.length);
        const departmentOptions = getDepartmentOptions(res.data);
        this.setData({ 
          players: res.data,
          departmentOptions: departmentOptions,
          filteredDepartments1: departmentOptions,
          filteredDepartments2: departmentOptions,
          filteredPlayers1: res.data,
          filteredPlayers2: res.data
        });
      })
      .catch(err => {
        console.error('加载选手列表失败', err);
      });
  },

  loadMatchResults: function () {
    db.collection('matches')
      .orderBy('createTime', 'desc')
      .limit(50)
      .get()
      .then(res => {
        console.log('加载比赛结果成功', res.data.length);
        this.setData({ matchResults: res.data });
      })
      .catch(err => {
        console.error('加载比赛结果失败', err);
      });
  },

  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  showAddItemDialog: function () {
    this.setData({
      showAddItemModal: true,
      newItem: {
        name: '',
        status: '报名中',
        description: ''
      },
      statusIndex: 0
    });
  },

  closeItemModal: function () {
    this.setData({ showAddItemModal: false });
  },

  onItemNameInput: function (e) {
    this.setData({
      'newItem.name': e.detail.value
    });
  },

  selectPresetItem: function (e) {
    const name = e.currentTarget.dataset.name;
    this.setData({
      'newItem.name': name
    });
  },

  onItemStatusChange: function (e) {
    const index = e.detail.value;
    this.setData({
      statusIndex: index,
      'newItem.status': this.data.statusOptions[index]
    });
  },

  onItemDescInput: function (e) {
    this.setData({
      'newItem.description': e.detail.value
    });
  },

  saveItem: function () {
    const { newItem } = this.data;
    
    if (!newItem.name.trim()) {
      wx.showToast({
        title: '请输入项目名称',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    db.collection('match_items').add({
      data: {
        ...newItem,
        createTime: db.serverDate()
      }
    }).then(() => {
      wx.hideLoading();
      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });
      this.closeItemModal();
      this.loadMatchItems();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '创建失败',
        icon: 'none'
      });
      console.error('创建比赛项目失败', err);
    });
  },

  deleteItem: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个比赛项目吗？',
      success: res => {
        if (res.confirm) {
          db.collection('match_items').doc(id).remove().then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadMatchItems();
          }).catch(err => {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  goToMatchItemManage: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/match-item/match-item?id=${id}`
    });
  },

  showAddMatchDialog: function () {
    this.setData({
      showAddMatchModal: true,
      newMatch: {
        itemId: '',
        itemName: '',
        team1: [],
        team2: [],
        team1Department: '',
        team2Department: '',
        score1: 0,
        score2: 0,
        winner: 1,
        round: '第1轮'
      },
      roundIndex: 0,
      team1PlayerIds: [],
      team2PlayerIds: [],
      team1Players: [],
      team2Players: [],
      filteredDepartments1: this.data.departmentOptions,
      filteredDepartments2: this.data.departmentOptions,
      searchKeyword1: '',
      searchKeyword2: '',
      filteredPlayers1: this.data.players,
      filteredPlayers2: this.data.players
    });
  },

  closeMatchModal: function () {
    this.setData({ showAddMatchModal: false });
  },

  onMatchItemChange: function (e) {
    const index = e.detail.value;
    const item = this.data.matchItems[index];
    this.setData({
      'newMatch.itemId': item._id,
      'newMatch.itemName': item.name
    });
  },

  onRoundChange: function (e) {
    const index = e.detail.value;
    this.setData({
      roundIndex: index,
      'newMatch.round': this.data.roundOptions[index]
    });
  },

  onScore1Input: function (e) {
    this.setData({
      'newMatch.score1': parseInt(e.detail.value) || 0
    });
  },

  onScore2Input: function (e) {
    this.setData({
      'newMatch.score2': parseInt(e.detail.value) || 0
    });
  },

  onTeam1DepartmentInput: function (e) {
    const value = e.detail.value;
    this.setData({
      'newMatch.team1Department': value,
      filteredDepartments1: filterDepartmentOptions(this.data.departmentOptions, value)
    });
  },

  onTeam2DepartmentInput: function (e) {
    const value = e.detail.value;
    this.setData({
      'newMatch.team2Department': value,
      filteredDepartments2: filterDepartmentOptions(this.data.departmentOptions, value)
    });
  },

  selectTeam1Department: function (e) {
    const department = e.currentTarget.dataset.department;
    this.setData({
      'newMatch.team1Department': department,
      filteredDepartments1: filterDepartmentOptions(this.data.departmentOptions, department)
    });
  },

  selectTeam2Department: function (e) {
    const department = e.currentTarget.dataset.department;
    this.setData({
      'newMatch.team2Department': department,
      filteredDepartments2: filterDepartmentOptions(this.data.departmentOptions, department)
    });
  },

  onWinnerChange: function (e) {
    this.setData({
      'newMatch.winner': parseInt(e.detail.value)
    });
  },

  onSearchPlayer1: function (e) {
    const keyword = e.detail.value.trim().toLowerCase();
    const filtered = keyword 
      ? this.data.players.filter(p => p.name.toLowerCase().indexOf(keyword) >= 0)
      : this.data.players;
    this.setData({
      searchKeyword1: keyword,
      filteredPlayers1: filtered
    });
  },

  onSearchPlayer2: function (e) {
    const keyword = e.detail.value.trim().toLowerCase();
    const filtered = keyword 
      ? this.data.players.filter(p => p.name.toLowerCase().indexOf(keyword) >= 0)
      : this.data.players;
    this.setData({
      searchKeyword2: keyword,
      filteredPlayers2: filtered
    });
  },

  toggleTeam1Player: function (e) {
    const player = e.currentTarget.dataset.player;
    const ids = this.data.team1PlayerIds.slice();
    const players = this.data.team1Players.slice();
    
    const index = ids.indexOf(player._id);
    if (index >= 0) {
      ids.splice(index, 1);
      players.splice(index, 1);
    } else {
      ids.push(player._id);
      players.push({
        id: player._id,
        name: player.name,
        openid: player._openid,
        department: player.department || ''
      });
    }

    const nextData = {
      team1PlayerIds: ids,
      team1Players: players,
      'newMatch.team1': players
    };

    if (!this.data.newMatch.team1Department && player.department) {
      nextData['newMatch.team1Department'] = player.department;
      nextData.filteredDepartments1 = filterDepartmentOptions(this.data.departmentOptions, player.department);
    }
    
    this.setData(nextData);
  },

  toggleTeam2Player: function (e) {
    const player = e.currentTarget.dataset.player;
    const ids = this.data.team2PlayerIds.slice();
    const players = this.data.team2Players.slice();
    
    const index = ids.indexOf(player._id);
    if (index >= 0) {
      ids.splice(index, 1);
      players.splice(index, 1);
    } else {
      ids.push(player._id);
      players.push({
        id: player._id,
        name: player.name,
        openid: player._openid,
        department: player.department || ''
      });
    }

    const nextData = {
      team2PlayerIds: ids,
      team2Players: players,
      'newMatch.team2': players
    };

    if (!this.data.newMatch.team2Department && player.department) {
      nextData['newMatch.team2Department'] = player.department;
      nextData.filteredDepartments2 = filterDepartmentOptions(this.data.departmentOptions, player.department);
    }
    
    this.setData(nextData);
  },

  removeTeam1Player: function (e) {
    const index = e.currentTarget.dataset.index;
    const ids = this.data.team1PlayerIds.slice();
    const players = this.data.team1Players.slice();
    ids.splice(index, 1);
    players.splice(index, 1);
    this.setData({
      team1PlayerIds: ids,
      team1Players: players,
      'newMatch.team1': players
    });
  },

  removeTeam2Player: function (e) {
    const index = e.currentTarget.dataset.index;
    const ids = this.data.team2PlayerIds.slice();
    const players = this.data.team2Players.slice();
    ids.splice(index, 1);
    players.splice(index, 1);
    this.setData({
      team2PlayerIds: ids,
      team2Players: players,
      'newMatch.team2': players
    });
  },

  saveMatch: function () {
    const { newMatch } = this.data;
    
    if (!newMatch.itemName) {
      wx.showToast({
        title: '请选择比赛项目',
        icon: 'none'
      });
      return;
    }

    if (newMatch.team1.length === 0 || newMatch.team2.length === 0) {
      wx.showToast({
        title: '请选择参赛选手',
        icon: 'none'
      });
      return;
    }

    if (!newMatch.team1Department.trim() || !newMatch.team2Department.trim()) {
      wx.showToast({
        title: '请填写双方部门',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const team1Names = newMatch.team1.map(p => p.name).join('、');
    const team2Names = newMatch.team2.map(p => p.name).join('、');

    db.collection('matches').add({
      data: {
        ...newMatch,
        team1Name: team1Names,
        team2Name: team2Names,
        matchTime: db.serverDate(),
        createTime: db.serverDate()
      }
    }).then(() => {
      this.updatePlayerRankings(newMatch);
      this.updateDepartmentRankings(newMatch);
      wx.hideLoading();
      wx.showToast({
        title: '录入成功',
        icon: 'success'
      });
      this.closeMatchModal();
      this.loadMatchResults();
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '录入失败',
        icon: 'none'
      });
      console.error('录入比赛结果失败', err);
    });
  },

  deleteMatch: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条比赛结果吗？',
      success: res => {
        if (res.confirm) {
          db.collection('matches').doc(id).remove().then(() => {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadMatchResults();
          }).catch(err => {
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  updatePlayerRankings: function (match) {
    const winnerTeam = match.winner === 1 ? match.team1 : match.team2;
    const allPlayers = [...match.team1, ...match.team2];
    
    allPlayers.forEach(player => {
      this.updatePlayerRanking(player, winnerTeam);
    });
  },

  updateDepartmentRankings: function (match) {
    const departments = [
      {
        name: match.team1Department.trim(),
        isWinner: match.winner === 1
      },
      {
        name: match.team2Department.trim(),
        isWinner: match.winner === 2
      }
    ];

    departments.forEach(department => {
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

  updatePlayerRanking: function (player, winnerTeam) {
    const isWinner = winnerTeam.some(p => p.id === player.id);
    
    db.collection('rankings').where({
      playerId: player.id
    }).get().then(res => {
      if (res.data.length > 0) {
        const record = res.data[0];
        const updateData = {
          match: (record.match || 0) + 1,
          department: player.department || record.department || '',
          updateTime: db.serverDate()
        };
        
        if (isWinner) {
          updateData.win = (record.win || 0) + 1;
          updateData.total = (record.total || 0) + 1;
        }
        
        db.collection('rankings').doc(record._id).update({
          data: updateData
        });
      } else {
        db.collection('rankings').add({
          data: {
            playerId: player.id,
            playerName: player.name,
            playerOpenid: player.openid,
            department: player.department || '',
            total: isWinner ? 1 : 0,
            win: isWinner ? 1 : 0,
            match: 1,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
      }
    }).catch(err => {
      console.error('更新排名失败', err);
    });
  },

  onPullDownRefresh: function () {
    this.loadData();
    wx.stopPullDownRefresh();
  },

  stopPropagation: function () {
  }
});

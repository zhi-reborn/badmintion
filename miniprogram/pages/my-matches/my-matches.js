const app = getApp();
const db = wx.cloud.database();
const _ = db.command;
const { fetchAll } = require('../../utils/db');

Page({
  data: {
    currentTab: 0,
    matchItems: [],
    matches: [],
    loading: true
  },

  onShow: function () {
    this.loadData();
  },

  loadData: function () {
    this.setData({ loading: true });
    app.getUserOpenId(openid => {
      if (!openid) {
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
        return;
      }
      this.openid = openid;
      fetchAll(db, 'registrations', { where: { _openid: openid } }).then(list => {
        this.myRegistrationIds = list.map(r => r._id);
        this.loadMyMatchItems(list);
        this.loadMyMatches();
        wx.stopPullDownRefresh();
      }).catch(err => {
        console.error('加载报名记录失败', err);
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
      });
    });
  },

  loadMyMatchItems: function (registrations) {
    const itemNames = [];
    registrations.forEach(r => (r.items || []).forEach(name => {
      if (name && itemNames.indexOf(name) < 0) itemNames.push(name);
    }));

    if (itemNames.length === 0) {
      this.setData({ matchItems: [], loading: false });
      return;
    }

    fetchAll(db, 'match_items', {
      where: { name: _.in(itemNames) },
      orderBy: 'createTime'
    }).then(list => {
      this.setData({ matchItems: list, loading: false });
    }).catch(err => {
      console.error('加载比赛项目失败', err);
      this.setData({ loading: false });
    });
  },

  loadMyMatches: function () {
    const openid = this.openid;
    const regIds = this.myRegistrationIds || [];
    const conditions = [
      { 'team1.openid': openid },
      { 'team2.openid': openid }
    ];
    if (regIds.length > 0) {
      conditions.push({ 'team1.id': _.in(regIds) });
      conditions.push({ 'team2.id': _.in(regIds) });
    }

    fetchAll(db, 'matches', {
      where: _.or(conditions),
      orderBy: 'matchTime'
    }).then(list => {
      const matches = list.map(m => this.decorateMatch(m, openid));
      this.setData({ matches });
    }).catch(err => {
      console.error('加载比赛记录失败', err);
    });
  },

  decorateMatch: function (match, openid) {
    const regIds = this.myRegistrationIds || [];
    const inTeam = team => (team || []).some(p =>
      p.openid === openid || (p.id && regIds.indexOf(p.id) >= 0)
    );
    const myTeamNum = inTeam(match.team1) ? 1 : (inTeam(match.team2) ? 2 : 0);

    return Object.assign({}, match, {
      team1Display: match.team1Name ||
        (match.team1 || []).map(p => p.name).join('、') || '队伍1',
      team2Display: match.team2Name ||
        (match.team2 || []).map(p => p.name).join('、') || '队伍2',
      myTeamNum: myTeamNum,
      isWin: myTeamNum > 0 && match.winner === myTeamNum,
      isLose: myTeamNum > 0 && match.winner !== myTeamNum,
      timeDisplay: this.formatTime(match.matchTime || match.createTime)
    });
  },

  formatTime: function (date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const pad = n => (n < 10 ? '0' + n : '' + n);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  },

  onTabChange: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ currentTab: index });
  },

  goToMatchDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/match-detail/match-detail?id=${id}`
    });
  },

  onPullDownRefresh: function () {
    this.loadData();
  }
});

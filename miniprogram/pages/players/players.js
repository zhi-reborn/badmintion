const db = wx.cloud.database();
const { fetchAll } = require('../../utils/db');

Page({
  data: {
    players: [],
    filteredPlayers: [],
    currentItem: '全部',
    itemOptions: ['全部', '团体赛', '趣味赛'],
    loading: true
  },

  onLoad: function () {
    this.loadPlayers();
  },

  onShow: function () {
    this.loadPlayers();
  },

  loadPlayers: function () {
    fetchAll(db, 'registrations', { orderBy: 'createTime' }).then(list => {
      this.setData({
        players: list,
        filteredPlayers: list,
        loading: false
      });
      wx.stopPullDownRefresh();
    }).catch(err => {
      console.error('加载选手列表失败', err);
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  onItemChange: function (e) {
    const index = e.detail.value;
    const item = this.data.itemOptions[index];

    this.setData({ currentItem: item });

    if (item === '全部') {
      this.setData({ filteredPlayers: this.data.players });
    } else {
      const filtered = this.data.players.filter(player =>
        player.items && player.items.includes(item)
      );
      this.setData({ filteredPlayers: filtered });
    }
  },

  onPullDownRefresh: function () {
    this.loadPlayers();
  },

  onShareAppMessage: function () {
    return {
      title: '羽毛球协会 · 参赛选手风采',
      path: '/pages/players/players'
    };
  },

  onShareTimeline: function () {
    return { title: '羽毛球协会 · 参赛选手风采' };
  }
});

Page({
  data: {
    players: [],
    filteredPlayers: [],
    currentItem: '全部',
    itemOptions: ['全部', '男单', '女单', '男双', '女双', '混双'],
    loading: true
  },

  onLoad: function () {
    this.loadPlayers();
  },

  onShow: function () {
    this.loadPlayers();
  },

  loadPlayers: function () {
    const db = wx.cloud.database();
    db.collection('registrations')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        this.setData({
          players: res.data,
          filteredPlayers: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载选手列表失败', err);
        this.setData({ loading: false });
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

  getSkillLevelClass: function (level) {
    const levelMap = {
      '初级': 'skill-beginner',
      '中级': 'skill-intermediate',
      '高级': 'skill-advanced',
      '专业': 'skill-professional'
    };
    return levelMap[level] || 'skill-beginner';
  },

  onPullDownRefresh: function () {
    this.loadPlayers();
    wx.stopPullDownRefresh();
  }
});

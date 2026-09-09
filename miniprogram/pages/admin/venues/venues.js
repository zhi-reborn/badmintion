const db = wx.cloud.database();
const { fetchAll } = require('../../../utils/db');

Page({
  data: {
    venues: [],
    loading: true,
    showAddModal: false,
    editMode: false,
    editId: '',
    formData: {
      name: '',
      type: '室内',
      address: '',
      price: 0,
      rating: 5.0,
      facilities: [],
      description: ''
    },
    typeOptions: ['室内', '室外'],
    typeIndex: 0,
    facilityOptions: ['停车场', '更衣室', '淋浴', '空调', '灯光', '休息区'],
    selectedFacilities: []
  },

  onLoad: function () {
    this.loadVenues();
  },

  onShow: function () {
    this.loadVenues();
  },

  loadVenues: function () {
    this.setData({ loading: true });
    
    fetchAll(db, 'venues', { orderBy: 'createTime' })
      .then(list => {
        this.setData({
          venues: list,
          loading: false
        });
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('加载场地失败', err);
        this.setData({ loading: false });
        wx.showModal({
          title: '提示',
          content: 'venues 集合不存在，请先在云开发控制台创建该集合',
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
        name: '',
        type: '室内',
        address: '',
        price: 0,
        rating: 5.0,
        facilities: [],
        description: ''
      },
      typeIndex: 0,
      selectedFacilities: []
    });
  },

  editVenue: function (e) {
    const id = e.currentTarget.dataset.id;
    const venue = this.data.venues.find(v => v._id === id);
    
    if (venue) {
      this.setData({
        showAddModal: true,
        editMode: true,
        editId: id,
        formData: {
          name: venue.name,
          type: venue.type,
          address: venue.address || '',
          price: venue.price || 0,
          rating: venue.rating || 5.0,
          facilities: venue.facilities || [],
          description: venue.description || ''
        },
        typeIndex: this.data.typeOptions.indexOf(venue.type),
        selectedFacilities: venue.facilities || []
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

  onFacilityChange: function (e) {
    const selected = e.detail.value;
    this.setData({
      selectedFacilities: selected,
      'formData.facilities': selected
    });
  },

  saveVenue: function () {
    const { formData, editMode, editId } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入场地名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const saveData = {
      ...formData,
      price: Number(formData.price) || 0,
      rating: Number(formData.rating) || 5.0
    };

    if (editMode) {
      db.collection('venues').doc(editId).update({
        data: {
          ...saveData,
          updateTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '修改成功', icon: 'success' });
        this.closeModal();
        this.loadVenues();
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '修改失败', icon: 'none' });
      });
    } else {
      db.collection('venues').add({
        data: {
          ...saveData,
          status: 'active',
          createTime: db.serverDate()
        }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success' });
        this.closeModal();
        this.loadVenues();
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '添加失败', icon: 'none' });
      });
    }
  },

  deleteVenue: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个场地吗？',
      success: res => {
        if (res.confirm) {
          db.collection('venues').doc(id).remove().then(() => {
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.loadVenues();
          }).catch(err => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onPullDownRefresh: function () {
    this.loadVenues();
  },

  stopPropagation: function () {
  }
});

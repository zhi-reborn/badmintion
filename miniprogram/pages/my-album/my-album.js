const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    photos: [],
    loading: true
  },

  onLoad: function () {
    this.loadPhotos();
  },

  onShow: function () {
    this.loadPhotos();
  },

  loadPhotos: function () {
    this.setData({ loading: true });
    
    app.getUserOpenId(openid => {
      if (!openid) {
        this.setData({ loading: false });
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      db.collection('photos').where({
        _openid: openid
      }).orderBy('createTime', 'desc').get().then(res => {
        const photos = res.data.map(photo => ({
          ...photo,
          createTimeStr: this.formatTime(photo.createTime)
        }));
        this.setData({
          photos: photos,
          loading: false
        });
      }).catch(err => {
        console.error('加载照片失败', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
    });
  },

  chooseImage: function () {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths;
        this.uploadImages(tempFilePaths);
      }
    });
  },

  uploadImages: function (filePaths) {
    wx.showLoading({ title: '上传中...' });
    
    app.getUserOpenId(openid => {
      if (!openid) {
        wx.hideLoading();
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }

      const uploadPromises = filePaths.map(path => {
        const cloudPath = `photos/${openid}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        return wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: path
        });
      });

      Promise.all(uploadPromises).then(results => {
        const dbPromises = results.map(result => {
          return db.collection('photos').add({
            data: {
              fileID: result.fileID,
              createTime: db.serverDate()
            }
          });
        });

        return Promise.all(dbPromises);
      }).then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
        this.loadPhotos();
      }).catch(err => {
        wx.hideLoading();
        console.error('上传失败', err);
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      });
    });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.photos.map(p => p.fileID);
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  deletePhoto: function (e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: res => {
        if (res.confirm) {
          const photo = this.data.photos.find(p => p._id === id);
          
          if (photo && photo.fileID) {
            wx.cloud.deleteFile({
              fileList: [photo.fileID]
            }).catch(err => {
              console.error('删除云文件失败', err);
            });
          }

          db.collection('photos').doc(id).remove().then(() => {
            wx.showToast({
              title: '已删除',
              icon: 'success'
            });
            this.loadPhotos();
          }).catch(err => {
            console.error('删除记录失败', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  formatTime: function (date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onPullDownRefresh: function () {
    this.loadPhotos();
    wx.stopPullDownRefresh();
  }
});
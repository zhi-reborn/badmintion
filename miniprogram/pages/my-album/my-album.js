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
        wx.stopPullDownRefresh();
      }).catch(err => {
        console.error('加载照片失败', err);
        this.setData({ loading: false });
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
    });
  },

  chooseImage: function () {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
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

      // 先上传云存储，再逐张做内容安全检测，检测通过才写入照片记录
      const uploadTasks = filePaths.map(path => {
        const cloudPath = `photos/${openid}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
        return wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: path
        }).then(res => {
          return this.checkImage(res.fileID).then(pass => ({ fileID: res.fileID, pass }));
        });
      });

      Promise.all(uploadTasks).then(results => {
        const passed = results.filter(r => r.pass);
        const rejected = results.filter(r => !r.pass);

        // 未通过检测的图片直接删除云文件，不留存
        if (rejected.length > 0) {
          wx.cloud.deleteFile({
            fileList: rejected.map(r => r.fileID)
          }).catch(() => { });
        }

        if (passed.length === 0) {
          wx.hideLoading();
          wx.showToast({
            title: '图片含违规信息，请更换后重试',
            icon: 'none'
          });
          return null;
        }

        const dbPromises = passed.map(r => {
          return db.collection('photos').add({
            data: {
              fileID: r.fileID,
              createTime: db.serverDate()
            }
          });
        });

        return Promise.all(dbPromises).then(() => {
          wx.hideLoading();
          if (rejected.length > 0) {
            wx.showToast({
              title: `${rejected.length}张图片含违规信息已拦截`,
              icon: 'none'
            });
          } else {
            wx.showToast({
              title: '上传成功',
              icon: 'success'
            });
          }
          this.loadPhotos();
        });
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

  // 调用 imgSecCheck 云函数检测图片内容，检测失败时按不通过处理
  checkImage: function (fileID) {
    return wx.cloud.callFunction({
      name: 'imgSecCheck',
      data: { fileID: fileID }
    }).then(res => {
      const result = res.result || {};
      return result.code === 0 && result.pass === true;
    }).catch(err => {
      console.error('内容检测失败', err);
      return false;
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
  }
});
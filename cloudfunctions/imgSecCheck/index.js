const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 图片内容安全检测：传入云存储 fileID，返回是否通过
exports.main = async (event) => {
  const { fileID } = event;

  if (!fileID) {
    return { code: -1, message: '缺少文件' };
  }

  // imgSecCheck v2 要求传入可公网访问的图片链接，先把 fileID 换成临时链接
  let tempFileURL = '';
  try {
    const urlRes = await cloud.getTempFileURL({ fileList: [fileID] });
    const file = urlRes.fileList && urlRes.fileList[0];
    tempFileURL = file && file.tempFileURL;
  } catch (err) {
    console.error('获取临时链接失败', err);
  }

  if (!tempFileURL) {
    return { code: -1, message: '获取文件链接失败' };
  }

  const wxContext = cloud.getWXContext();

  try {
    const res = await cloud.openapi.security.imgSecCheck({
      version: 2,
      scene: 1,
      openid: wxContext.OPENID,
      mediaUrl: tempFileURL
    });

    // suggest: pass(通过) / review(需人工复核) / block(违规)
    const suggest = res && res.result && res.result.suggest;
    return { code: 0, pass: suggest === 'pass', suggest };
  } catch (err) {
    console.error('图片检测失败', err);
    return { code: -1, message: '检测服务异常' };
  }
};

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { phone, code } = event
  
  console.log('发送验证码到手机:', phone, '验证码:', code)
  
  return {
    success: true,
    message: '验证码发送成功',
    code: code
  }
}
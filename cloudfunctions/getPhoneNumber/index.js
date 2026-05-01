const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { encryptedData, iv } = event
  const wxContext = cloud.getWXContext()
  
  try {
    const result = await cloud.openapi.phonenumber.getPhoneNumber({
      code: event.code
    })
    
    if (result.errCode === 0 && result.phoneInfo) {
      return {
        success: true,
        phoneNumber: result.phoneInfo.phoneNumber,
        purePhoneNumber: result.phoneInfo.purePhoneNumber,
        countryCode: result.phoneInfo.countryCode
      }
    } else {
      return {
        success: false,
        message: '获取手机号失败'
      }
    }
  } catch (err) {
    console.error('getPhoneNumber error:', err)
    return {
      success: false,
      message: err.message || '获取手机号失败'
    }
  }
}
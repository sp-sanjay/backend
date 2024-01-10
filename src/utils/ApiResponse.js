import { COOKIE_OPTIONS } from "../constants/config.constant.js"

const ApiResponse = (res, data = null, message = 'Success', statusCode = 200, cookies = {}) => {
  const response = {
    statusCode,
    data,
    message,
    success: statusCode < 400
  }
  if(Object.keys(cookies)?.length) {
   return res.status(statusCode)
    .cookie("accessToken", cookies.accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", cookies.refreshToken, COOKIE_OPTIONS)
    .json(response)
  }
  return res.status(statusCode).json(response)
}

export { ApiResponse }
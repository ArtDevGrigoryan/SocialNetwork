function sendSuccess(res, data, status = 200, message = "Success") {
  return res.status(status).json({
    success: true,
    message: message,
    payload: data,
  });
}

function sendError(
  res,
  message = "An error occurred",
  status = 500,
  error = null,
) {
  return res.status(status).json({
    success: false,
    message: message,
    error: error,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};

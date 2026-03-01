function sendSuccess(res, data, status = 200, message = "Success") {
  return res.status(status).json({
    success: true,
    message: message,
    payload: data,
  });
}

function sendError(res, error, status = 500, message = "An error occurred") {
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

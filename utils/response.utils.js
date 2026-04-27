module.exports = {
  successResponse: (res, statusCode, message, data = null) => {
    const body = { success: true, message };
    if (data !== null) body.data = data;
    return res.status(statusCode).json(body);
  },
  errorResponse: (res, statusCode, message, error = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      error: error ? error.toString() : null
    });
  }
};

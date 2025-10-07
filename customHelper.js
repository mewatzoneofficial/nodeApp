const db = require('./db'); // your db connection file

// Generic query helper with Promise
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err); // Pass error to catch()
      } else {
        resolve(result);
      }
    });
  });
};

// Success response
const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({
    success: true,
    data,
  });
};

// Error response
const sendError = (res, message, status = 500) => {
  res.status(status).json({
    success: false,
    message,
  });
};

module.exports = { runQuery, sendSuccess, sendError };

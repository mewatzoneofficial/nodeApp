// Ensure correct relative path to dbConnection.js
import dbConnection from './dbConnection.js';

export const runQuery = (query, params = []) => {
  if (!Array.isArray(params)) params = [params];
  return new Promise((resolve, reject) => {
    dbConnection.query(query, params, (err, result) => {
      if (err) {
        console.error("DB Query Error:", err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

export function sendSuccess(res, data, message = "Success", status = 200) {
  res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, message = "Server Error", status = 500) {
  res.status(status).json({
    success: false,
    message,
  });
}

export default {
  runQuery,
  sendSuccess,
  sendError,
};
const { runQuery, sendError, sendSuccess } = require('../utility/customHelper');

exports.authProfile = async (req, res) => {
  const adminID = req.params.id; 
  try {
    const results = await runQuery(
      "SELECT * FROM admin WHERE adminID = ?",
      [adminID]
    );

    if (!results.length) return sendError(res, "User not found", 404);

    return sendSuccess(res, results[0]);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};


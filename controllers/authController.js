const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendError, sendSuccess, runQuery } = require("../utility/customHelper");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";


exports.deleteAnonymousUser = async (req, res) => {
  try {
    const query = `
      DELETE FROM anonymous_facuilty
      WHERE mobile IN (
          SELECT mobile FROM faculity_users WHERE mobile IS NOT NULL
      )
      OR email IN (
          SELECT email FROM faculity_users WHERE email IS NOT NULL
      )
      OR mobile IN (
          SELECT mobile FROM employer_user WHERE mobile IS NOT NULL
      )
      OR email IN (
          SELECT email FROM employer_user WHERE email IS NOT NULL
      );
    `;
    const result = await runQuery(query);
    if (result.affectedRows === 0) {
      return sendError(res, "No matching anonymous users found", 404);
    }

    sendSuccess(res, {
      message: "Anonymous users deleted successfully",
      deletedCount: result.affectedRows,
    });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

exports.deleteAnonymousUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query; // defaults
    const offset = (page - 1) * limit;

    // Step 1: Select the anonymous users to delete
    const selectQuery = `
      SELECT af.id
      FROM anonymous_facuilty af
      LEFT JOIN faculity_users fu 
        ON af.mobile = fu.mobile OR af.email = fu.email
      LEFT JOIN employer_user eu 
        ON af.mobile = eu.mobile OR af.email = eu.email
      WHERE fu.mobile IS NOT NULL 
         OR fu.email IS NOT NULL
         OR eu.mobile IS NOT NULL
         OR eu.email IS NOT NULL
      LIMIT ? OFFSET ?;
    `;

    const usersToDelete = await runQuery(selectQuery, [
      parseInt(limit),
      parseInt(offset),
    ]);

    if (usersToDelete.length === 0) {
      return sendError(
        res,
        "No matching anonymous users found for this page",
        404
      );
    }

    const ids = usersToDelete.map((u) => u.id);

    // Step 2: Delete only those selected users
    const deleteQuery = `DELETE FROM anonymous_facuilty WHERE id IN (?);`;
    const result = await runQuery(deleteQuery, [ids]);

    // Step 3: Return response
    sendSuccess(res, {
      message: "Anonymous users deleted successfully",
      deletedCount: result.affectedRows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

exports.authUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("req.body", req.body)

  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  try {
    const results = await runQuery(
      `SELECT adminID, name, mobile, email, official_email, official_mobile, password, image, dob, joining_date,
              gender, created_at 
      FROM admin 
      WHERE email = ?`,
      [email]
    );

    if (results.length === 0) {
      return sendError(res, "Invalid email or password, user not found", 401);
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = jwt.sign(
      { id: user.adminID, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const { password: _, ...userWithoutPassword } = user;

    sendSuccess(res, { user: userWithoutPassword, token });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

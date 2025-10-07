const bcrypt = require("bcryptjs");
const { runQuery, sendSuccess, sendError } = require("../customHelper");

// 📜 Get all users with pagination
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT adminID, name, mobile, email, official_email, official_mobile, image, dob, joining_date, 
             gender, created_at 
      FROM admin
      ORDER BY adminID DESC
      LIMIT ? OFFSET ?
    `;
    const results = await runQuery(sql, [limit, offset]);

    const countSql = "SELECT COUNT(*) AS total FROM admin";
    const countResult = await runQuery(countSql);
    const total = countResult[0].total;

    sendSuccess(res, {
      results,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// 📜 Get user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await runQuery("SELECT * FROM admin WHERE adminID = ?", [id]);
    if (results.length === 0) {
      return sendError(res, "User not found", 404);
    }
    sendSuccess(res, results[0]);
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// 🧩 Create a new user
exports.createUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;
  console.log(req.body);

  if (!name || !email || !mobile || !password) {
    return sendError(res, "All fields (name, email, mobile, password) are required", 400);
  }

  try {
    // Check if email or mobile already exists
    const existing = await runQuery(
      "SELECT adminID FROM admin WHERE email = ? OR mobile = ?",
      [email, mobile]
    );
    if (existing.length > 0) {
      return sendError(res, "Email or mobile number already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await runQuery(
      "INSERT INTO admin (name, email, mobile, password) VALUES (?, ?, ?, ?)",
      [name, email, mobile, hashedPassword]
    );

    sendSuccess(
      res,
      {
        id: result.insertId,
        name,
        email,
        mobile,
      },
      201
    );
  } catch (err) {
    console.error("❌ Error creating user:", err);
    sendError(res, "Server error: " + err.message, 500);
  }
};

// ✏️ Update user by ID
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;

  if (!name || !email || !mobile) {
    return sendError(res, "Name, email, and mobile are required to update user", 400);
  }

  try {
    const result = await runQuery(
      "UPDATE admin SET name = ?, email = ?, mobile = ? WHERE adminID = ?",
      [name, email, mobile, id]
    );

    if (result.affectedRows === 0) {
      return sendError(res, "User not found", 404);
    }

    sendSuccess(res, { id, name, email, mobile });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// 🗑️ Delete user by ID
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await runQuery("DELETE FROM admin WHERE adminID = ?", [id]);

    if (result.affectedRows === 0) {
      return sendError(res, "User not found", 404);
    }

    sendSuccess(res, { message: "User deleted successfully" });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

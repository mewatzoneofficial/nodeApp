const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { runQuery, sendSuccess, sendError } = require("../customHelper");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { name, email } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (name) {
      whereClause += " AND name LIKE ?";
      params.push(`%${name}%`);
    }

    if (email) {
      whereClause += " AND (email LIKE ? OR official_email LIKE ?)";
      params.push(`%${email}%`, `%${email}%`);
    }

    // Main query
    const sql = `SELECT adminID, name, mobile, email, official_email, official_mobile, image, dob, joining_date,
             gender, created_at
      FROM admin
      ${whereClause}
      ORDER BY adminID DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const results = await runQuery(sql, params);

    // Count total results
    const countSql = `SELECT COUNT(*) AS total FROM admin ${whereClause}`;
    const countResult = await runQuery(countSql, params.slice(0, -2)); 
    const total = countResult[0].total;

    sendSuccess(res, {
      results,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });

  } catch (err) {
    console.error("Error fetching users:", err);
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

exports.deleteAnonymousUser = async (req, res) => {
  try {
    const query = `
      DELETE af
      FROM anonymous_faculty af
      LEFT JOIN faculty_users fu 
        ON af.mobile = fu.mobile OR af.email = fu.email
      LEFT JOIN employer_user eu 
        ON af.mobile = eu.mobile OR af.email = eu.email
      WHERE fu.mobile IS NOT NULL 
         OR fu.email IS NOT NULL
         OR eu.mobile IS NOT NULL
         OR eu.email IS NOT NULL;
    `;

    const result = await runQuery(query);

    if (result.affectedRows === 0) {
      return sendError(res, "No matching anonymous users found", 404);
    }

    sendSuccess(res, { 
      message: "Anonymous users deleted successfully",
      deletedCount: result.affectedRows 
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
      FROM anonymous_faculty af
      LEFT JOIN faculty_users fu 
        ON af.mobile = fu.mobile OR af.email = fu.email
      LEFT JOIN employer_user eu 
        ON af.mobile = eu.mobile OR af.email = eu.email
      WHERE fu.mobile IS NOT NULL 
         OR fu.email IS NOT NULL
         OR eu.mobile IS NOT NULL
         OR eu.email IS NOT NULL
      LIMIT ? OFFSET ?;
    `;

    const usersToDelete = await runQuery(selectQuery, [parseInt(limit), parseInt(offset)]);

    if (usersToDelete.length === 0) {
      return sendError(res, "No matching anonymous users found for this page", 404);
    }

    const ids = usersToDelete.map(u => u.id);

    // Step 2: Delete only those selected users
    const deleteQuery = `DELETE FROM anonymous_faculty WHERE id IN (?);`;
    const result = await runQuery(deleteQuery, [ids]);

    // Step 3: Return response
    sendSuccess(res, { 
      message: "Anonymous users deleted successfully",
      deletedCount: result.affectedRows,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};


// 📜 Login API
// exports.authUser = async (req, res) => {
//   const { email, password } = req.body;
//   console.log("req.body login", req.body)
//   if (!email || !password) {
//     return sendError(res, "Email and password are required", 400);
//   }

//   try {
//     // const results = await runQuery("SELECT * FROM admin WHERE email = ?", [email]);
//     const results = await runQuery(
//       `SELECT adminID, name, mobile, email, official_email, official_mobile, password, image, dob, joining_date,
//               gender, created_at 
//       FROM admin 
//       WHERE email = ?`,
//       [email]
//     );


//     if (results.length === 0) {
//       return sendError(res, "Invalid email or password", 401);
//     }

//     const user = results[0];

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return sendError(res, "Invalid email or password", 401);
//     }

//     const { password: _, ...userWithoutPassword } = user;
//     sendSuccess(res, userWithoutPassword);
//   } catch (err) {
//     sendError(res, err.message, 500);
//   }
// };



exports.authUser = async (req, res) => {
  const { email, password } = req.body;

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
      return sendError(res, "Invalid email or password", 401);
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = jwt.sign({ id: user.adminID, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user;

    sendSuccess(res, { user: userWithoutPassword, token });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

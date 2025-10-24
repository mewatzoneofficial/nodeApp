import bcrypt from "bcryptjs";
import { runQuery, sendSuccess, sendError } from "../customHelper.js";

// Get all admins with pagination and search
export const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
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

    const sql = `
      SELECT adminID, name, mobile, email, official_email, official_mobile, image, dob, joining_date,
             gender, created_at
      FROM admin
      ${whereClause}
      ORDER BY adminID DESC
      LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const results = await runQuery(sql, params);

    const countSql = `SELECT COUNT(*) AS total FROM admin ${whereClause}`;
    const countResult = await runQuery(countSql, params.slice(0, -2));
    const total = countResult?.[0]?.total || 0;

    return sendSuccess(res, {
      results,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
    return sendError(res, err.message, 500);
  }
};

// Get admin by ID
export const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await runQuery("SELECT * FROM admin WHERE adminID = ?", [id]);

    if (!results.length) return sendError(res, "User not found", 404);

    return sendSuccess(res, results[0]);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// Create a new admin
export const createRecord = async (req, res) => {
  const { name, mobile, email, official_email, official_mobile, password, dob, joining_date, gender } = req.body;

  if (!name || !email || !mobile || !password) {
    return sendError(res, "Name, email, mobile, and password are required", 400);
  }

  try {
    const existing = await runQuery("SELECT adminID FROM admin WHERE email = ? OR mobile = ?", [email, mobile]);
    if (existing.length) return sendError(res, "Email or mobile already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `INSERT INTO admin 
       (name, email, mobile, password, official_email, official_mobile, dob, joining_date, gender)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, mobile, hashedPassword, official_email || null, official_mobile || null, dob || null, joining_date || null, gender || null]
    );

    return sendSuccess(
      res,
      { id: result.insertId, name, email, mobile, official_email, official_mobile, dob, joining_date, gender },
      201
    );
  } catch (err) {
    console.error("Error creating admin:", err);
    return sendError(res, "Server error: " + err.message, 500);
  }
};

// Update admin by ID
export const updateRecord = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;

  if (!name || !email || !mobile) {
    return sendError(res, "Name, email, and mobile are required to update", 400);
  }

  try {
    const result = await runQuery(
      "UPDATE admin SET name = ?, email = ?, mobile = ? WHERE adminID = ?",
      [name, email, mobile, id]
    );

    if (!result.affectedRows) return sendError(res, "User not found", 404);

    return sendSuccess(res, { id, name, email, mobile });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// Delete admin by ID
export const deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await runQuery("DELETE FROM admin WHERE adminID = ?", [id]);

    if (!result.affectedRows) return sendError(res, "User not found", 404);

    return sendSuccess(res, { message: "User deleted successfully" });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

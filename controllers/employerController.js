import bcrypt from "bcryptjs";
import { runQuery, sendSuccess, sendError } from "../customHelper.js";

// Get all employers
export const getAll = async (req, res) => {
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
      whereClause += " AND email LIKE ?";
      params.push(`%${email}%`);
    }

    const sql = `SELECT employerID, emp_eny_id, created_by, name, official_name, username, designation,
                 email, mobile, status, pay_status, info_verified, updated_at, created_at, employertype,
                 signuptype, level, brand_level, gst, logo, featured, lead, approval_status, hide_status
                 FROM employer_user
                 ${whereClause}
                 ORDER BY employerID DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const results = await runQuery(sql, params);

    const countSql = `SELECT COUNT(*) AS total FROM employer_user ${whereClause}`;
    const countResult = await runQuery(countSql, params.slice(0, -2));
    const total = countResult?.[0]?.total || 0;

    sendSuccess(res, {
      results,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching employers:", err);
    sendError(res, err.message, 500);
  }
};

// Get employer by ID
export const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const results = await runQuery("SELECT * FROM employer_user WHERE employerID = ?", [id]);
    if (!results?.length) return sendError(res, "Employer not found", 404);
    sendSuccess(res, results[0]);
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// Create a new employer
export const createRecord = async (req, res) => {
  const { name, email, mobile, password, username, designation } = req.body;
  if (!name || !email || !mobile || !password) {
    return sendError(res, "Name, email, mobile, and password are required", 400);
  }

  try {
    const existing = await runQuery(
      "SELECT employerID FROM employer_user WHERE email = ? OR mobile = ?",
      [email, mobile]
    );
    if (existing?.length) return sendError(res, "Email or mobile already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `INSERT INTO employer_user 
       (name, email, mobile, password, username, designation) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, mobile, hashedPassword, username || null, designation || null]
    );

    sendSuccess(res, { id: result.insertId, name, email, mobile, username, designation }, 201);
  } catch (err) {
    console.error("Error creating employer:", err);
    sendError(res, err.message, 500);
  }
};

// Update employer
export const updateRecord = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile, username, designation } = req.body;

  if (!name || !email || !mobile) {
    return sendError(res, "Name, email, and mobile are required", 400);
  }

  try {
    const result = await runQuery(
      `UPDATE employer_user SET name = ?, email = ?, mobile = ?, username = ?, designation = ? 
       WHERE employerID = ?`,
      [name, email, mobile, username || null, designation || null, id]
    );

    if (!result?.affectedRows) return sendError(res, "Employer not found", 404);
    sendSuccess(res, { id, name, email, mobile, username, designation });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

// Delete employer
export const deleteRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await runQuery("DELETE FROM employer_user WHERE employerID = ?", [id]);
    if (!result?.affectedRows) return sendError(res, "Employer not found", 404);
    sendSuccess(res, { message: "Employer deleted successfully" });
  } catch (err) {
    sendError(res, err.message, 500);
  }
};

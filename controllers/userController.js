
import bcrypt from "bcryptjs";
import { runQuery, sendSuccess, sendError } from "../customHelper.js";

// Get all faculty users with pagination and search
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
      whereClause += " AND email LIKE ?";
      params.push(`%${email}%`);
    }

    const sql = `
      SELECT faculityID, eny_id, work_status, username, search_type, packID, packsubid, premium, 
             name, personal_lname, email, mobile, gender, country_code, alternate_contact, dob, age, 
             device_type, regToken, state, city, area, added_by, login_type, language, skill, 
             job_function, industry_type, qualification, university, passing_year, experience, 
             month_experience, salary, current_employer, current_employer_website, current_position, 
             current_start_year, current_start_month, last_employer, last_duration_start_year, 
             last_duration_start_month, last_duration_end_year, last_duration_end_month, status, 
             image, image_from, created_by, duration_notice_period, nopack_noti, cv_doc, 
             salary_slip, current_drawn_salary, expected_salary, negotiable, login_token, update_status, 
             last_login, video, emailtoken, emailverify, demolecture, exam_link, call_note, remarks, 
             extra_note, updated_at, created_at, last_view_by, last_view_at, remarksAdded, selectedJob, 
             selectedEmployer, selectedJoiningDate, selectedPackage, selectedLocation, teachingLevel, 
             otherTeachingLevel, relocate, ip_address, lat, lon, location, logged_in, is_deleted, 
             deleted_at, deleted_by, hash, profile_flow, chatgpt_resume
      FROM faculity_users
      ${whereClause}
      ORDER BY faculityID DESC
      LIMIT ? OFFSET ?`;

    params.push(limit, offset);

    const results = await runQuery(sql, params);

    const countSql = `SELECT COUNT(*) AS total FROM faculity_users ${whereClause}`;
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
    console.error("Error fetching faculty users:", err);
    return sendError(res, err.message, 500);
  }
};

// Get faculty user by ID
export const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const results = await runQuery("SELECT * FROM faculity_users WHERE faculityID = ?", [id]);

    if (!results.length) return sendError(res, "User not found", 404);

    return sendSuccess(res, results[0]);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// Create a new faculty user
export const createRecord = async (req, res) => {
  const { name, email, mobile, password, dob, gender } = req.body;

  if (!name || !email || !mobile || !password) {
    return sendError(res, "Name, email, mobile, and password are required", 400);
  }

  try {
    const existing = await runQuery("SELECT faculityID FROM faculity_users WHERE email = ? OR mobile = ?", [email, mobile]);
    if (existing.length) return sendError(res, "Email or mobile already exists", 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(
      `INSERT INTO faculity_users 
       (name, email, mobile, password, dob, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, mobile, hashedPassword, dob || null, gender || null]
    );

    return sendSuccess(
      res,
      { id: result.insertId, name, email, mobile, dob, gender },
      201
    );
  } catch (err) {
    console.error("Error creating faculty user:", err);
    return sendError(res, "Server error: " + err.message, 500);
  }
};

// Update faculty user by ID
export const updateRecord = async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;

  if (!name || !email || !mobile) {
    return sendError(res, "Name, email, and mobile are required to update", 400);
  }

  try {
    const result = await runQuery(
      "UPDATE faculity_users SET name = ?, email = ?, mobile = ? WHERE faculityID = ?",
      [name, email, mobile, id]
    );

    if (!result.affectedRows) return sendError(res, "User not found", 404);

    return sendSuccess(res, { id, name, email, mobile });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// Delete faculty user by ID
export const deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await runQuery("DELETE FROM faculity_users WHERE faculityID = ?", [id]);

    if (!result.affectedRows) return sendError(res, "User not found", 404);

    return sendSuccess(res, { message: "User deleted successfully" });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

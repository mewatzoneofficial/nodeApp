import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { runQuery, sendSuccess, sendError } from "../customHelper.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export const authUser = async (req, res) => {
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

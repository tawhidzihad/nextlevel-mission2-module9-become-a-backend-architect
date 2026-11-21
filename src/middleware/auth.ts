import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import type { Role } from "../types";
import sendResponse from "../utils/sendResponse";

const auth = (...roles: Role[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			// if the token exist
			// Verify token
			// Check the user exist
			// Is user staus active

			const token = req.headers.authorization;

			if (!token) {
				return sendResponse(res, {
					statusCode: 401,
					success: false,
					message: "Unauthorized access!!",
				});
			}

			const decode = jwt.verify(
				token as string,
				config.jwt_secret,
			) as JwtPayload;

			const user = await pool.query(
				`
                    SELECT * FROM users WHERE email=$1
                `,
				[decode.email],
			);

			if (user.rowCount === 0) {
				return sendResponse(res, {
					statusCode: 404,
					success: false,
					message: "User not found!!",
				});
			}

			if (!user.rows[0].is_active) {
				return sendResponse(res, {
					statusCode: 403,
					success: false,
					message: "Forbidden!!",
				});
			}

			// roles = ["admin", "agent"]
			// user.rows[0].role = admin
			if (roles.length && !roles.includes(user.rows[0].role)) {
				return sendResponse(res, {
					statusCode: 401,
					success: false,
					message: "Unauthorized access!!",
				});
			}

			req.user = decode;

			next();
		} catch (error) {
			next(error);
		}
	};
};
export default auth;

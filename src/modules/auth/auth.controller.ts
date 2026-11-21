import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";

const loginUser = async (req: Request, res: Response) => {
	try {
		const result = await authService.loginUserIntoDB(req.body);

		const { refreshToken } = result;

		res.cookie("refreshToken", refreshToken, {
			// http = false, in developement
			// https = true, in production
			secure: false,

			// Prevent XXS attack
			httpOnly: true,

			// "none" : allow all domains,
			// "strict" : Only one domain,
			// "lax" : only domain and some time other domain
			// * This prevent SCRF Attack
			sameSite: "lax",

			// maxAge:

			// Path for redirect after login
			path: "/",

			domain: "localhost", //example.com
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User loggedin successfully",
			data: result,
		});
	} catch (error: any) {
		sendResponse(res, {
			statusCode: 500,
			success: false,
			message: error?.message,
			error: error,
		});
	}
};

const generateToken = async (req: Request, res: Response) => {
	try {
		// console.log(req.cookies.refreshToken);
		const result = await authService.generateAccessToken(
			req.cookies.refreshToken,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Access token generated successfully",
			data: result,
		});
	} catch (error: any) {
		sendResponse(res, {
			statusCode: 500,
			success: false,
			message: error?.message,
			error: error,
		});
	}
};

export const authController = {
	loginUser,
	generateToken,
};

import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { profileService } from "./profile.service";

const createProfile = async (red: Request, res: Response) => {
	try {
		const result = await profileService.createProfileIntoDB(red.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "Profile created successfully!",
			data: result.rows[0],
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

export const profileController = {
	createProfile,
};

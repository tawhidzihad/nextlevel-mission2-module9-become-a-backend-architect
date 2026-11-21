import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse";
import { userService } from "./user.service";

const createUser = async (req: Request, res: Response) => {
	try {
		const result = await userService.createUserIntoDB(req.body);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: "User created successfully!",
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

const getAllUsers = async (req: Request, res: Response) => {
	// console.log("From controller", req.user);
	try {
		const result = await userService.getAllUsersFromDB();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Users retrived successfully!",
			data: result.rows,
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

const getSingleUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const result = await userService.getSingleUserFromDB(id as string);

		if (result.rowCount === 0) {
			return sendResponse(res, {
				statusCode: 404,
				success: false,
				message: "User not found",
			});
		}

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User retrived successfully!",
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

const updateUser = async (req: Request, res: Response) => {
	try {
		const id = req.params.id;

		const result = await userService.updateUserFromDB(
			req.body,
			id as string,
		);

		if (result.rowCount === 0) {
			return sendResponse(res, {
				statusCode: 404,
				success: false,
				message: "User not found",
			});
		}

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User update successfully!",
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

const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const result = await userService.deleteUserFromDB(id as string);

		if (result.rowCount === 0) {
			return sendResponse(res, {
				statusCode: 404,
				success: false,
				message: "User not found",
			});
		}

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "User deleted successfully!",
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

export const userController = {
	createUser,
	getAllUsers,
	getSingleUser,
	updateUser,
	deleteUser,
};

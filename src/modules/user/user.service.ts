import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./user.interface";

// Create User in DB
const createUserIntoDB = async (payload: IUser) => {
	const { name, age, email, password, role } = payload;

	const hashedPassword = await bcrypt.hash(password, 10);

	const result = await pool.query(
		`
            INSERT INTO users (name, age, email, password, role)
            VALUES ($1, $2, $3, $4, COALESCE($5, 'user'))
            RETURNING *
        `,
		[name, age, email, hashedPassword, role],
	);

	delete result.rows[0].password;

	return result;
};

// Get All Users
const getAllUsersFromDB = async () => {
	const result = await pool.query(
		`
            SELECT * FROM users 
        `,
	);
	return result;
};

// Get Single Users
const getSingleUserFromDB = async (id: string) => {
	const result = await pool.query(
		`
            SELECT * FROM users WHERE id = $1
        `,
		[id],
	);

	return result;
};

// Update Single Users
const updateUserFromDB = async (payload: Partial<IUser>, id: string) => {
	const { name, age, password, is_Active } = payload;

	const result = await pool.query(
		`
            UPDATE users
            SET
            name = COALESCE($1, name),
            age = COALESCE($2, age),
            password = COALESCE($3, password),
            is_Active = COALESCE($4, is_Active),
            updated_at = NOW()

            WHERE id=$5
            RETURNING *
        `,
		[name ?? null, age ?? null, password ?? null, is_Active ?? null, id],
	);

	return result;
};

// Delete Users
const deleteUserFromDB = async (id: string) => {
	const result = await pool.query(
		`
            DELETE FROM users
            WHERE id = $1
        `,
		[id],
	);

	return result;
};

export const userService = {
	createUserIntoDB,
	getAllUsersFromDB,
	getSingleUserFromDB,
	updateUserFromDB,
	deleteUserFromDB,
};

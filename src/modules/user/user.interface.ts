export interface IUser {
	name: string;
	age?: number | null;
	email: string;
	password: string;
	is_Active?: boolean;
	role?: string;
}

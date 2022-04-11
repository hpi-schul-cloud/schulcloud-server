export interface IAccount {
	id?: string;
	userName?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
}

export interface IAccountUpdate {
	email?: string;
	firstName?: string;
	lastName?: string;
}

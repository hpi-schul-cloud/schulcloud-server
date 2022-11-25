export interface IAccount {
	id?: string;
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
}

export interface IAccountUpdate {
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
}

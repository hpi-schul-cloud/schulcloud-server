export type IAccount = {
	id: string;
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	createdDate?: Date;
	attRefTechnicalId?: string;
	attRefFunctionalIntId?: string;
	attRefFunctionalExtId?: string;
};

export type IAccountUpdate = Omit<IAccount, 'id'>;

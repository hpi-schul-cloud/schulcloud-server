export type IAccount = {
	id: string;
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	createdTimestamp?: Date;
	attRefTechnicalId?: string;
	attRefFunctionalIntId?: string;
	attRefFunctionalExtId?: string;
};

export type IAccountUpdate = Omit<IAccount, 'id'>;

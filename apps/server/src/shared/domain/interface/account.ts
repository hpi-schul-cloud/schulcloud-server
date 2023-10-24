export type IdmAccount = {
	id: string;
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	createdDate?: Date;
	attDbcAccountId?: string;
	attDbcUserId?: string;
	attDbcSystemId?: string;
};

export type IdmAccountUpdate = Omit<IdmAccount, 'id'>;

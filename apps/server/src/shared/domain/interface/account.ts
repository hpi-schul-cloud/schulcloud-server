// TODO: somehow make clear that this is either a local or a keycloak account. For example by defining this as a union type
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

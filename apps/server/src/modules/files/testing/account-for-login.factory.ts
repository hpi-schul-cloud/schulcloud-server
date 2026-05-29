import { ObjectId } from '@mikro-orm/mongodb';

export interface AccountForLogin {
	id: string;
	username: string;
}

export interface AccountForLoginParams {
	id?: string;
	username?: string;
}

export const accountForLoginFactory = {
	build(params: AccountForLoginParams = {}): AccountForLogin {
		return {
			id: params.id ?? new ObjectId().toHexString(),
			username: params.username ?? `user-${new ObjectId().toHexString()}@example.com`,
		};
	},
};

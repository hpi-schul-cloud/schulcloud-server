import { ObjectId } from '@mikro-orm/mongodb';

interface AccountForLogin {
	id: string;
	username: string;
}

interface AccountForLoginParams {
	id?: string;
	username?: string;
}

const accountForLoginFactory = {
	build(params: AccountForLoginParams = {}): AccountForLogin {
		return {
			id: params.id ?? new ObjectId().toHexString(),
			username: params.username ?? `user-${new ObjectId().toHexString()}@example.com`,
		};
	},
};

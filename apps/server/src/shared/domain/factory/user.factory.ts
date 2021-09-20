import { ObjectId } from '@mikro-orm/mongodb';
import { User } from '../entity/user.entity';

export const userFactory = {
	build: (props?: { firstName?: string; lastName?: string }): User => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: `user.${Date.now()}@example.com`,
			roles: [],
			school: new ObjectId().toHexString(),
			...props,
		});
		return user;
	},
};

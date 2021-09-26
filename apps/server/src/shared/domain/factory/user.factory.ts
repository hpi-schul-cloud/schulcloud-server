import { User } from '../entity/user.entity';
import { schoolFactory } from './school.factory';

export const userFactory = {
	build: (props?: { firstName?: string; lastName?: string }): User => {
		const user = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: `user.${Date.now()}@example.com`,
			roles: [],
			school: schoolFactory.build(),
			...props,
		});
		return user;
	},
};

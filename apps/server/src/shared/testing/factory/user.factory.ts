import { User, IUserProperties } from '@shared/domain';
import { schoolFactory } from './school.factory';
import { BaseFactory } from './base.factory';

export const userFactory = BaseFactory.define<User, IUserProperties>(User, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		school: schoolFactory.build(),
	};
});

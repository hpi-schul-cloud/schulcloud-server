import { IUserProperties, RoleName, User } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';
import { schoolFactory } from './school.factory';

class UserFactory extends BaseFactory<User, IUserProperties> {
	withRole(name: RoleName): this {
		const params: DeepPartial<IUserProperties> = { roles: [roleFactory.buildWithId({ name })] };
		return this.params(params);
	}
}

export const userFactory = UserFactory.define(User, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		school: schoolFactory.build(),
	};
});

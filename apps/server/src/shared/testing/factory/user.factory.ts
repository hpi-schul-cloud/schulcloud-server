import { User, IUserProperties } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { schoolFactory } from './school.factory';
import { BaseFactory } from './base.factory';
import { roleFactory } from './role.factory';

class UserFactory extends BaseFactory<User, IUserProperties> {
	withRole(name: string): this {
		const params: DeepPartial<IUserProperties> = { roles: roleFactory.buildList(1, { name }) };
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
		ldapId: '1111',
	};
});

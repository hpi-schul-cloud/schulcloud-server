import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { EntityId } from '@shared/domain/types';
import { DoBaseFactory } from '@testing/factory/domainobject';
import { DeepPartial } from 'fishery';
import { UserDo } from '../domain';

class UserDoFactory extends DoBaseFactory<UserDo, UserDo> {
	public withRoles(roles: { id: EntityId; name: RoleName }[]): UserDoFactory {
		const params: DeepPartial<UserDo> = {
			roles,
		};

		return this.params(params);
	}
}

export const userDoFactory = UserDoFactory.define(UserDo, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		schoolId: new ObjectId().toString(),
		secondarySchools: [],
	};
});

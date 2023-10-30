import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { ObjectId } from 'bson';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from './domainobject/do-base.factory';

class UserDoFactory extends DoBaseFactory<UserDO, UserDO> {
	withRoles(roles: { id: EntityId; name: RoleName }[]) {
		const params: DeepPartial<UserDO> = {
			roles,
		};

		return this.params(params);
	}
}

export const userDoFactory = UserDoFactory.define(UserDO, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roles: [],
		schoolId: new ObjectId().toString(),
	};
});

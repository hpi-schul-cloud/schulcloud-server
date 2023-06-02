import { UserDO } from '@shared/domain/domainobject/user.do';
import { ObjectId } from 'bson';
import { BuildOptions, DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

class UserDoFactory extends BaseFactory<UserDO, UserDO> {
	buildWithId(params?: DeepPartial<UserDO>, id?: string, options: BuildOptions<UserDO, any> = {}): UserDO {
		const entity: UserDO = super.buildWithId(params, id, options);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const entityWithId = Object.assign(entity, { id: new ObjectId(id).toString() });

		return entityWithId;
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

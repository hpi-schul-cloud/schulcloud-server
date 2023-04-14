import { UserDO } from '@shared/domain/domainobject/user.do';
import { BuildOptions, DeepPartial } from 'fishery';
import { ObjectId } from 'bson';
import { BaseEntityTestFactory } from './base-entity-test.factory';

class UserDoFactory extends BaseEntityTestFactory<UserDO, UserDO> {
	buildWithId(params?: DeepPartial<UserDO>, id?: string, options: BuildOptions<UserDO, any> = {}): UserDO {
		const entity: UserDO = super.buildWithId(params, id, options);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const entityWithId = Object.assign(entity, { id: new ObjectId(id).toString() });

		return entityWithId;
	}

	withDates(): this {
		const params: DeepPartial<UserDO> = { createdAt: new Date(), updatedAt: new Date() };
		return this.params(params);
	}
}

export const userDoFactory = UserDoFactory.define(UserDO, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roleIds: [],
		schoolId: new ObjectId().toString(),
	};
});

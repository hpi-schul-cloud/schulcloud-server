import { UserDO } from '@shared/domain/domainobject/user.do';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

class UserDoFactory extends BaseFactory<UserDO, UserDO> {}

export const userDoFactory = UserDoFactory.define(UserDO, ({ sequence }) => {
	return {
		firstName: 'John',
		lastName: `Doe ${sequence}`,
		email: `user-${sequence}@example.com`,
		roleIds: [],
		schoolId: new ObjectId().toString(),
	};
});

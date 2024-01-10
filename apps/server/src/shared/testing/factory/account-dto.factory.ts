import { Account } from '@src/modules/account/domain';
import { ObjectId } from 'bson';
import { defaultTestPasswordHash } from './account.factory';
import { BaseFactory } from './base.factory';

export const accountDtoFactory = BaseFactory.define<Account, Account>(Account, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		createdAt: new Date(),
		updatedAt: new Date(),
		systemId: new ObjectId().toHexString(),
		username: `Username-${sequence}`,
		password: defaultTestPasswordHash,
		activated: true,
		userId: new ObjectId().toHexString(),
	};
});

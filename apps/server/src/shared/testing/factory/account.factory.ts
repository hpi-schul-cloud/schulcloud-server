import { Account, IAccountProperties } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from './base.factory';

export const accountFactory = BaseFactory.define<Account, IAccountProperties>(Account, ({ sequence }) => {
	return {
		username: `account #${sequence}`,
		userId: new ObjectId(),
	};
});

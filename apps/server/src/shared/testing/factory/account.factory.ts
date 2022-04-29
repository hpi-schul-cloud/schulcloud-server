import { Account, IAccountProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const accountFactory = BaseFactory.define<Account, IAccountProperties>(Account, ({ sequence }) => {
	return {
		username: `account #${sequence}`,
		userId: `user #${sequence}`,
	};
});

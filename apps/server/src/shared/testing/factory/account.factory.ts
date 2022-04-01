import { Account, IAccountProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { systemFactory } from './system.factory';
import { userFactory } from './user.factory';

export const accountFactory = BaseFactory.define<Account, IAccountProperties>(Account, ({ sequence }) => {
	return {
		username: `account #${sequence}`,
		user: userFactory.build(),
		system: systemFactory.build(),
	};
});

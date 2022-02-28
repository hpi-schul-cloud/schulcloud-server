import { ObjectId } from 'bson';
import { Account, IAccountProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';
import { systemFactory } from './system.factory';
// import { userFactory } from '@shared/testing';

export const accountFactory = BaseFactory.define<Account, IAccountProperties>(Account, ({ sequence }) => {
	return {
		system: systemFactory.build(),
		username: `jon${sequence}`,
		userId: new ObjectId(),
		systemId: new ObjectId(),
	};
});

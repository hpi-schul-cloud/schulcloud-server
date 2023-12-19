import { Account } from '@modules/account';
import { ObjectId } from 'bson';
import { defaultTestPasswordHash } from './account.factory';
import { BaseFactory } from './base.factory';

// TODO: check if this nessesary
export const accountDoFactory = BaseFactory.define<Account, Account>(
	Account,
	({ sequence }) =>
		new Account({
			id: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
			systemId: new ObjectId().toHexString(),
			username: `Username-${sequence}`,
			password: defaultTestPasswordHash,
			activated: true,
			userId: new ObjectId().toHexString(),
		})
);

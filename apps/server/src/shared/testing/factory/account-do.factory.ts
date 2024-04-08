import { ObjectId } from '@mikro-orm/mongodb';
import { Account, AccountProps } from '@modules/account';
import { DomainObjectFactory } from './domainobject';

export const accountDoFactory = DomainObjectFactory.define<Account, AccountProps>(Account, ({ sequence, params }) => {
	return {
		...params,
		id: params.id || new ObjectId().toHexString(),
		username: params.username || `Username-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

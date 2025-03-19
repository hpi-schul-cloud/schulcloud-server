import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject';
import { Account, AccountProps } from '../domain';

export const accountDoFactory = DomainObjectFactory.define<Account, AccountProps>(Account, ({ sequence, params }) => {
	return {
		...params,
		id: params.id || new ObjectId().toHexString(),
		username: params.username || `Username-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

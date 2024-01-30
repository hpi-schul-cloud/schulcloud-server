import { Account, AccountProps } from '@src/modules/account/domain';
import { ObjectId } from 'bson';
import { DomainObjectFactory } from './domainobject';

export const accountDtoFactory = DomainObjectFactory.define<Account, AccountProps>(Account, ({ sequence, params }) => {
	return {
		...params,
		id: params.id || new ObjectId().toHexString(),
		username: params.username || `Username-${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

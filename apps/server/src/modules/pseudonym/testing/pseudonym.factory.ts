import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObjectFactory } from '@testing/factory/domainobject/domain-object.factory';
import { Pseudonym, PseudonymProps } from '../repo';

export const pseudonymFactory = DomainObjectFactory.define<Pseudonym, PseudonymProps>(Pseudonym, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		pseudonym: `pseudonym${sequence}`,
		toolId: 'toolId',
		userId: 'userId',
		createdAt: new Date(2023, 6, 1),
		updatedAt: new Date(2023, 7, 1),
	};
});

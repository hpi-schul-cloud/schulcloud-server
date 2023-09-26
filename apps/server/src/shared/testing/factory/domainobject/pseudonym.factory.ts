import { ObjectId } from '@mikro-orm/mongodb';
import { Pseudonym, PseudonymProps } from '@shared/domain';
import { DomainObjectFactory } from './domain-object.factory';

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

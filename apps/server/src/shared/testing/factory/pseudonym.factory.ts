import { BaseFactory } from '@shared/testing/factory/base.factory';
import { IPseudonymProperties, Pseudonym } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';

export const pseudonymFactory = BaseFactory.define<Pseudonym, IPseudonymProperties>(Pseudonym, ({ sequence }) => {
	return {
		pseudonym: `pseudonym-${sequence}`,
		toolId: new ObjectId(),
		userId: new ObjectId(),
	};
});

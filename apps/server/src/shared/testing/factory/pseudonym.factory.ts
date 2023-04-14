import { IPseudonymProperties, Pseudonym } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseEntityTestFactory } from './base-entity-test.factory';

export const pseudonymFactory = BaseEntityTestFactory.define<Pseudonym, IPseudonymProperties>(
	Pseudonym,
	({ sequence }) => {
		return {
			pseudonym: `pseudonym-${sequence}`,
			toolId: new ObjectId(),
			userId: new ObjectId(),
		};
	}
);

import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { PseudonymEntity, PseudonymEntityProps } from '../entity';

export const pseudonymEntityFactory = BaseFactory.define<PseudonymEntity, PseudonymEntityProps>(
	PseudonymEntity,
	({ sequence }) => {
		return {
			pseudonym: `pseudonym-${sequence}`,
			toolId: new ObjectId(),
			userId: new ObjectId(),
		};
	}
);

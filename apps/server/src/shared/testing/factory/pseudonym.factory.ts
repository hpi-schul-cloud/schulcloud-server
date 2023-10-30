import { ObjectId } from '@mikro-orm/mongodb';
import { PseudonymEntity, PseudonymEntityProps } from '@src/modules/pseudonym/entity/pseudonym.entity';
import { BaseFactory } from './base.factory';

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

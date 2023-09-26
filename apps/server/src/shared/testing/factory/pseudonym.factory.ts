import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { PseudonymEntity, PseudonymEntityProps } from '@src/modules/pseudonym/entity';

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

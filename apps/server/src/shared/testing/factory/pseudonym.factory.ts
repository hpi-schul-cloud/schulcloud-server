import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { IPseudonymEntityProps, PseudonymEntity } from '@src/modules/pseudonym/entity';

export const pseudonymEntityFactory = BaseFactory.define<PseudonymEntity, IPseudonymEntityProps>(
	PseudonymEntity,
	({ sequence }) => {
		return {
			pseudonym: `pseudonym-${sequence}`,
			toolId: new ObjectId(),
			userId: new ObjectId(),
		};
	}
);

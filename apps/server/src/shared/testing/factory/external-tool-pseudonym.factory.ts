import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolPseudonymEntity, ExternalToolPseudonymEntityProps } from '@modules/pseudonym/entity';
import { BaseFactory } from './base.factory';

export const externalToolPseudonymEntityFactory = BaseFactory.define<
	ExternalToolPseudonymEntity,
	ExternalToolPseudonymEntityProps
>(ExternalToolPseudonymEntity, ({ sequence }) => {
	return {
		pseudonym: `pseudonym-${sequence}`,
		toolId: new ObjectId(),
		userId: new ObjectId(),
	};
});

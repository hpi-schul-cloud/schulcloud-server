import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolPseudonymEntity, IExternalToolPseudonymEntityProps } from '@src/modules/pseudonym/entity';

export const externalToolPseudonymEntityFactory = BaseFactory.define<
	ExternalToolPseudonymEntity,
	IExternalToolPseudonymEntityProps
>(ExternalToolPseudonymEntity, ({ sequence }) => {
	return {
		pseudonym: `pseudonym-${sequence}`,
		toolId: new ObjectId(),
		userId: new ObjectId(),
	};
});

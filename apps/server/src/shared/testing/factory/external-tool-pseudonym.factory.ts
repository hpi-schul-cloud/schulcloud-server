import { ObjectId } from '@mikro-orm/mongodb';
import {
	ExternalToolPseudonymEntity,
	IExternalToolPseudonymEntityProps,
} from '@src/modules/pseudonym/entity/external-tool-pseudonym.entity';
import { BaseFactory } from './base.factory';

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

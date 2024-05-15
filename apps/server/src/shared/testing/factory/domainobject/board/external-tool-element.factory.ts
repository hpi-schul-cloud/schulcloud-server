import { ObjectId } from '@mikro-orm/mongodb';
import { ExternalToolElement, ExternalToolElementProps, ROOT_PATH } from '@modules/board/domain';
import { BaseFactory } from '../../base.factory';

export const externalToollElementFactory = BaseFactory.define<ExternalToolElement, ExternalToolElementProps>(
	ExternalToolElement,
	() => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			contextExternalToolId: new ObjectId().toHexString(), // TODO check if this should be undefined
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);

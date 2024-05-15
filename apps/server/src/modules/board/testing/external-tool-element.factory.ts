import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { ExternalToolElement, ExternalToolElementProps, ROOT_PATH } from '../domain';

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

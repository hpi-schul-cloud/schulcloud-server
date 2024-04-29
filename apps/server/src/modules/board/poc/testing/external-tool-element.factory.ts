import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { ExternalToolElement, ExternalToolElementProps, ROOT_PATH } from '../domain';

export const externalToollElementFactory = BaseFactory.define<ExternalToolElement, ExternalToolElementProps>(
	ExternalToolElement,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			path: ROOT_PATH,
			level: 0,
			position: 0,
			children: [],
			contextExternalToolId: new ObjectId().toHexString(),
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);

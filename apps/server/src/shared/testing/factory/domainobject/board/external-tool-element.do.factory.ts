import { ExternalToolElement, ExternalToolElementProps } from '@shared/domain/domainobject';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '../../base.factory';

export const externalToolElementFactory = BaseFactory.define<ExternalToolElement, ExternalToolElementProps>(
	ExternalToolElement,
	() => {
		return {
			id: new ObjectId().toHexString(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
);

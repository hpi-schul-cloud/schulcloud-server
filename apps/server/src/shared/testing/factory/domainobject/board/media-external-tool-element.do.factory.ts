import { ObjectId } from '@mikro-orm/mongodb';
import { MediaExternalToolElement, type MediaExternalToolElementProps } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

export const mediaExternalToolElementFactory = BaseFactory.define<
	MediaExternalToolElement,
	MediaExternalToolElementProps
>(MediaExternalToolElement, () => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		contextExternalToolId: new ObjectId().toHexString(),
	};
});

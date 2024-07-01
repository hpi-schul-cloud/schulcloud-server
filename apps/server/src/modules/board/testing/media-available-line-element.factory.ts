import { BaseFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { MediaAvailableLineElement, MediaAvailableLineElementProps } from '../domain';

export const mediaAvailableLineElementFactory = BaseFactory.define<
	MediaAvailableLineElement,
	MediaAvailableLineElementProps
>(MediaAvailableLineElement, () => {
	return {
		name: 'Element',
		description: 'Element description',
		logoUrl: 'https://logo.com',
		schoolExternalToolId: new ObjectId().toHexString(),
	};
});

import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaAvailableLineElement, MediaAvailableLineElementProps } from '../domain';

export const mediaAvailableLineElementFactory = BaseFactory.define<
	MediaAvailableLineElement,
	MediaAvailableLineElementProps
>(MediaAvailableLineElement, () => {
	return {
		name: 'Element',
		domain: 'test.com',
		description: 'Element description',
		logoUrl: 'https://logo.com',
		schoolExternalToolId: new ObjectId().toHexString(),
	};
});

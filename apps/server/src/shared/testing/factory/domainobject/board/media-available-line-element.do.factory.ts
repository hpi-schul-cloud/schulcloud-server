import { ObjectId } from '@mikro-orm/mongodb';
import { MediaAvailableLineElement, MediaAvailableLineElementProps } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

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

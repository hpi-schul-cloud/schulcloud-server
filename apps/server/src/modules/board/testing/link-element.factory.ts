import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing/factory';
import { LinkElement, LinkElementProps, ROOT_PATH } from '../domain';

export const linkElementFactory = BaseFactory.define<LinkElement, LinkElementProps>(LinkElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		path: ROOT_PATH,
		level: 0,
		title: `link element #${sequence}`,
		position: 0,
		children: [],
		description: `description #${sequence}`,
		url: `url #${sequence}`,
		imageUrl: `image-url #${sequence}`,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

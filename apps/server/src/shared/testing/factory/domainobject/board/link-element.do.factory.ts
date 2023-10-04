/* istanbul ignore file */
import { LinkElement, LinkElementProps } from '@shared/domain';
import { ObjectId } from 'bson';
import { BaseFactory } from '../../base.factory';

export const linkElementFactory = BaseFactory.define<LinkElement, LinkElementProps>(LinkElement, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		url: `https://www.example.com/link/${sequence}`,
		title: 'Website opengraph title',
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};
});

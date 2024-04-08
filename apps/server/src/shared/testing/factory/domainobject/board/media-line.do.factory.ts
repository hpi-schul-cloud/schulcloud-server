import { ObjectId } from '@mikro-orm/mongodb';
import { MediaLine, type MediaLineProps } from '@shared/domain/domainobject';
import { BaseFactory } from '../../base.factory';

export const mediaLineFactory = BaseFactory.define<MediaLine, MediaLineProps>(MediaLine, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		children: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		title: `Line ${sequence}`,
	};
});

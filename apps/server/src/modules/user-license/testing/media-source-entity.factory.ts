import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceEntity, MediaSourceEntityProps } from '../entity';

export const mediaSourceEntityFactory = BaseFactory.define<MediaSourceEntity, MediaSourceEntityProps>(
	MediaSourceEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			name: `media-source-${sequence}`,
			sourceId: `source-id-${sequence}`,
		};
	}
);

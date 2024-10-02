import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceDataFormat, MediaSourceEntity, MediaSourceEntityProps } from '../entity';
import { mediaSourceConfigFactory } from './media-source-config.factory';

export const mediaSourceEntityFactory = BaseFactory.define<MediaSourceEntity, MediaSourceEntityProps>(
	MediaSourceEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			name: `media-source-${sequence}`,
			sourceId: `source-id-${sequence}`,
			format: MediaSourceDataFormat.BILDUNGSLOGIN,
			config: mediaSourceConfigFactory.build(),
		};
	}
);

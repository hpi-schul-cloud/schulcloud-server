import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSource, MediaSourceProps } from '../domain';

export const mediaSourceFactory = BaseFactory.define<MediaSource, MediaSourceProps>(MediaSource, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `media-source-${sequence}`,
		sourceId: `source-id-${sequence}`,
	};
});

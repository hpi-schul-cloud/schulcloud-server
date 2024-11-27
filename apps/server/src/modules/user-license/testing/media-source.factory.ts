import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSource, MediaSourceProps } from '../domain';
import { MediaSourceDataFormat } from '../entity';
import { mediaSourceConfigFactory } from './media-source-config.factory';

export const mediaSourceFactory = BaseFactory.define<MediaSource, MediaSourceProps>(MediaSource, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `media-source-${sequence}`,
		sourceId: `source-id-${sequence}`,
		format: MediaSourceDataFormat.BILDUNGSLOGIN,
		oauthConfig: mediaSourceConfigFactory.build(),
	};
});

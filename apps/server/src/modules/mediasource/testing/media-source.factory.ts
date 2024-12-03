import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceProps, MediaSource } from '@src/modules/mediasource/domain';

import { MediaSourceDataFormat } from '@src/modules/mediasource/enum';

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

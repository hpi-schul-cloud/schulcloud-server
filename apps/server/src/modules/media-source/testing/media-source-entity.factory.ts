import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceEntity, MediaSourceEntityProps } from '../entity';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceBasicConfigEmbeddableFactory } from './media-source-basic-auth-config.embeddable.factory';
import { mediaSourceOAuthConfigEmbeddableFactory } from './media-source-oauth-config.embeddable.factory';

export const mediaSourceEntityFactory = BaseFactory.define<MediaSourceEntity, MediaSourceEntityProps>(
	MediaSourceEntity,
	({ sequence }) => {
		return {
			id: new ObjectId().toHexString(),
			name: `media-source-${sequence}`,
			sourceId: `source-id-${sequence}`,
			format: MediaSourceDataFormat.BILDUNGSLOGIN,
			oauthConfig: mediaSourceOAuthConfigEmbeddableFactory.build(),
			basicAuthConfig: mediaSourceBasicConfigEmbeddableFactory.build(),
		};
	}
);

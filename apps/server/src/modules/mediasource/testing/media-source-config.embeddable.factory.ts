import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceAuthMethod } from '../enum';
import {
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddableProps,
} from '../entity/media-source-oauth-config.embeddable';

export const mediaSourceConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddableProps
>(MediaSourceOauthConfigEmbeddable, ({ sequence }) => {
	return {
		_id: new ObjectId(),
		clientId: `media-source-client-id-${sequence}`,
		clientSecret: `media-source-client-secret-${sequence}`,
		authEndpoint: `media-source-auth-endpoint-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
	};
});

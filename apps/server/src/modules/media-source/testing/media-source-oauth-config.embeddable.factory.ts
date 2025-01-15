import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceOauthConfigEmbeddable } from '../entity';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceOAuthConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddable
>(MediaSourceOauthConfigEmbeddable, ({ sequence }) => {
	const embeddable: MediaSourceOauthConfigEmbeddable = {
		clientId: `media-source-client-id-${sequence}`,
		clientSecret: `media-source-client-secret-${sequence}`,
		authEndpoint: `media-source-auth-endpoint-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
	};

	return embeddable;
});

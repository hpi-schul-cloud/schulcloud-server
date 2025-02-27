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
		authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		baseUrl: `https://oauth-base-url.com/test-${sequence}`,
	};

	return embeddable;
});

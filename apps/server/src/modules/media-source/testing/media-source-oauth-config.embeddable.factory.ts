import { BaseFactory } from '@shared/testing';
import { MediaSourceAuthMethod } from '../enum';
import { MediaSourceOauthConfigEmbeddable } from '../entity';

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

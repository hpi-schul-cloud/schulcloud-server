import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BaseFactory } from '@testing/factory/base.factory';
import { encryptAES } from '@raisinten/aes-crypto-js';
import { MediaSourceOauthConfigEmbeddable } from '../entity';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceOAuthConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddable
>(MediaSourceOauthConfigEmbeddable, ({ sequence }) => {
	const key = Configuration.get('AES_KEY') as string;
	const embeddable: MediaSourceOauthConfigEmbeddable = {
		clientId: `media-source-client-id-${sequence}`,
		clientSecret: encryptAES(`media-source-client-secret-${sequence}`, key),
		authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		baseUrl: `https://oauth-base-url.com/test-${sequence}`,
	};

	return embeddable;
});

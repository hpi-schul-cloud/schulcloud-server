import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BaseFactory } from '@testing/factory/base.factory';
import CryptoJs from 'crypto-js';
import { MediaSourceOauthConfigEmbeddable } from '../entity';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceOAuthConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddable
>(MediaSourceOauthConfigEmbeddable, ({ sequence }) => {
	const embeddable: MediaSourceOauthConfigEmbeddable = {
		clientId: `media-source-client-id-${sequence}`,
		clientSecret: CryptoJs.AES.encrypt(
			`media-source-client-secret-${sequence}`,
			Configuration.get('AES_KEY') as string
		).toString(),
		authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		baseUrl: `https://oauth-base-url.com/test-${sequence}`,
	};

	return embeddable;
});

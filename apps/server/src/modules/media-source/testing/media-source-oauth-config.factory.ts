import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceOauthConfig } from '../do';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceOauthConfigFactory = BaseFactory.define<MediaSourceOauthConfig, MediaSourceOauthConfig>(
	MediaSourceOauthConfig,
	({ sequence }) => {
		const config: MediaSourceOauthConfig = {
			clientId: `media-source-client-id-${sequence}`,
			clientSecret: `media-source-client-secret-${sequence}`,
			authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
			method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
			baseUrl: `https://oauth-base-url.com/test-${sequence}`,
		};

		return config;
	}
);

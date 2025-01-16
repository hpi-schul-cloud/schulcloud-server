import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceOauthConfig } from '../domain';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceOauthConfigFactory = BaseFactory.define<MediaSourceOauthConfig, MediaSourceOauthConfig>(
	MediaSourceOauthConfig,
	({ sequence }) => {
		const config: MediaSourceOauthConfig = {
			clientId: `media-source-client-id-${sequence}`,
			clientSecret: `media-source-client-secret-${sequence}`,
			authEndpoint: `media-source-auth-endpoint-${sequence}`,
			method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		};

		return config;
	}
);

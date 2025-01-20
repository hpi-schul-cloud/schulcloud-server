import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceBasicAuthConfig } from '../domain';

export const mediaSourceBasicAuthConfigFactory = BaseFactory.define<
	MediaSourceBasicAuthConfig,
	MediaSourceBasicAuthConfig
>(MediaSourceBasicAuthConfig, ({ sequence }) => {
	const config: MediaSourceBasicAuthConfig = {
		username: `media-source-user-${sequence}`,
		password: `media-source-password-${sequence}`,
		authEndpoint: 'https://media-source-endpoint.com/test',
	};

	return config;
});

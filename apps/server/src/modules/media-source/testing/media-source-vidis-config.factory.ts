import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceVidisConfig } from '../do';

export const mediaSourceVidisConfigFactory = BaseFactory.define<MediaSourceVidisConfig, MediaSourceVidisConfig>(
	MediaSourceVidisConfig,
	({ sequence }) => {
		const config: MediaSourceVidisConfig = {
			username: `media-source-user-${sequence}`,
			password: `media-source-password-${sequence}`,
			baseUrl: 'https://media-source-endpoint.com',
			region: 'test-region',
			schoolNumberPrefix: 'NI_',
		};

		return config;
	}
);

import { Factory } from 'fishery';
import { type BiloMediaSource, type BiloOauthConfig } from '../interface';

export const biloOauthConfigFactory = Factory.define<BiloOauthConfig>(({ sequence }) => {
	return {
		clientId: `client-id-${sequence}`,
		clientSecret: `client-secret-${sequence}`,
		authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
		baseUrl: `https://oauth-base-url.com/test-${sequence}/`,
	};
});

export const biloMediaSourceFactory = Factory.define<BiloMediaSource>(({ sequence }) => {
	return {
		id: `media-source-id-${sequence}`,
		oauthConfig: biloOauthConfigFactory.build(),
	};
});

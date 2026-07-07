import { Factory } from 'fishery';
import { BiloMediaSource, BiloOauthConfig } from '../interface';

export const biloOauthConfigFactory = Factory.define<BiloOauthConfig>(({ sequence }) => ({
	clientId: `client-id-${sequence}`,
	clientSecret: `client-secret-${sequence}`,
	authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
	baseUrl: `https://oauth-base-url.com/test-${sequence}/`,
}));

export const biloMediaSourceFactory = Factory.define<BiloMediaSource>(({ sequence }) => ({
	id: `media-source-id-${sequence}`,
	oauthConfig: biloOauthConfigFactory.build(),
}));

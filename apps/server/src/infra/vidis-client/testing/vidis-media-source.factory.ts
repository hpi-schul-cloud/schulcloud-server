import { Factory } from 'fishery';
import { type VidisConfig, type VidisMediaSource } from '../interface';

const vidisConfigFactory = Factory.define<VidisConfig>(({ sequence }) => {
	return {
		username: `username-${sequence}`,
		password: `password-${sequence}`,
		baseUrl: 'https://media-source-endpoint.com',
		region: 'test-region',
	};
});

export const vidisMediaSourceFactory = Factory.define<VidisMediaSource>(({ sequence }) => {
	return {
		id: `media-source-id-${sequence}`,
		vidisConfig: vidisConfigFactory.build(),
	};
});

import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceOauthConfig, MediaSourceOauthConfigProps } from '../domain/media-source-oauth-config';
import { MediaSourceAuthMethod } from '../enum';

export const mediaSourceConfigFactory = BaseFactory.define<MediaSourceOauthConfig, MediaSourceOauthConfigProps>(
	MediaSourceOauthConfig,
	({ sequence }) => {
		const config = {
			id: new ObjectId().toHexString(),
			clientId: `media-source-client-id-${sequence}`,
			clientSecret: `media-source-client-secret-${sequence}`,
			authEndpoint: `media-source-auth-endpoint-${sequence}`,
			method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		};

		return config;
	}
);

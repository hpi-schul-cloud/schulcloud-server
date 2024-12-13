import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { MediaSourceBasicAuthConfig, MediaSourceBasicAuthConfigProps } from '../domain';

export const mediaSourceBasicAuthConfigFactory = BaseFactory.define<
	MediaSourceBasicAuthConfig,
	MediaSourceBasicAuthConfigProps
>(MediaSourceBasicAuthConfig, ({ sequence }) => {
	const config: MediaSourceBasicAuthConfigProps = {
		id: new ObjectId().toHexString(),
		username: `media-source-user-${sequence}`,
		password: `media-source-password-${sequence}`,
		authEndpoint: 'https://media-source-endpoint.com/test',
	};

	return config;
});

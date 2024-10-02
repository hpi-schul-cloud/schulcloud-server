import { BaseFactory } from '@shared/testing';
import {
	MediaSourceConfigEmbeddable,
	MediaSourceConfigEmbeddableProps,
} from '../entity/media-source-oauth-config.embeddable';
import { MediaSourceAuthMethod } from '../entity';

export const mediaSourceConfigFactory = BaseFactory.define<
	MediaSourceConfigEmbeddable,
	MediaSourceConfigEmbeddableProps
>(MediaSourceConfigEmbeddable, ({ sequence }) => {
	return {
		clientId: `media-source-client-id${sequence}`,
		clientSecret: `media-source-client-secret${sequence}`,
		authEndpoint: `media-source-auth-endpoint-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
	};
});

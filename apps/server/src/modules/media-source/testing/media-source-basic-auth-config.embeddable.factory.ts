import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceBasicAuthConfigEmbeddable } from '../entity';

export const mediaSourceBasicConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceBasicAuthConfigEmbeddable,
	MediaSourceBasicAuthConfigEmbeddable
>(MediaSourceBasicAuthConfigEmbeddable, ({ sequence }) => {
	const embeddable: MediaSourceBasicAuthConfigEmbeddable = {
		username: `media-source-client-id-${sequence}`,
		password: `media-source-client-secret-${sequence}`,
		authEndpoint: `media-source-auth-endpoint-${sequence}`,
	};

	return embeddable;
});

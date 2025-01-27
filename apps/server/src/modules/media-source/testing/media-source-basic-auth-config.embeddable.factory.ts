import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceVidisConfigEmbeddable } from '../entity';

export const mediaSourceVidisConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceVidisConfigEmbeddable,
	MediaSourceVidisConfigEmbeddable
>(MediaSourceVidisConfigEmbeddable, ({ sequence }) => {
	const embeddable: MediaSourceVidisConfigEmbeddable = {
		username: `media-source-client-id-${sequence}`,
		password: `media-source-client-secret-${sequence}`,
		baseUrl: 'https://media-source-endpoint.com',
		region: 'test-region',
	};

	return embeddable;
});

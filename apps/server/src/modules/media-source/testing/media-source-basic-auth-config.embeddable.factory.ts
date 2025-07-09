import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { encryptAES } from '@shared/common/utils';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceVidisConfigEmbeddable } from '../entity';

export const mediaSourceVidisConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceVidisConfigEmbeddable,
	MediaSourceVidisConfigEmbeddable
>(MediaSourceVidisConfigEmbeddable, ({ sequence }) => {
	const key = Configuration.get('AES_KEY') as string;
	const embeddable: MediaSourceVidisConfigEmbeddable = {
		username: encryptAES(`media-source-client-id-${sequence}`, key),
		password: encryptAES(`media-source-client-secret-${sequence}`, key),
		baseUrl: 'https://media-source-endpoint.com',
		region: 'test-region',
		schoolNumberPrefix: 'NI_',
	};

	return embeddable;
});

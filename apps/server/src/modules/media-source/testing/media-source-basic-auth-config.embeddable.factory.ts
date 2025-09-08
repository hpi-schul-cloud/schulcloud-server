import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { BaseFactory } from '@testing/factory/base.factory';
import CryptoJs from 'crypto-js';
import { MediaSourceVidisConfigEmbeddable } from '../entity';

export const mediaSourceVidisConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceVidisConfigEmbeddable,
	MediaSourceVidisConfigEmbeddable
>(MediaSourceVidisConfigEmbeddable, ({ sequence }) => {
	const embeddable: MediaSourceVidisConfigEmbeddable = {
		username: CryptoJs.AES.encrypt(
			`media-source-client-id-${sequence}`,
			Configuration.get('AES_KEY') as string
		).toString(),
		password: CryptoJs.AES.encrypt(
			`media-source-client-secret-${sequence}`,
			Configuration.get('AES_KEY') as string
		).toString(),
		baseUrl: 'https://media-source-endpoint.com',
		region: 'test-region',
		schoolNumberPrefix: 'NI_',
	};

	return embeddable;
});

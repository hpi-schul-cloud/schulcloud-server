import { AesEncryptionHelper } from '@shared/common/utils';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceVidisConfigEmbeddable } from '../entity';

type MediaSourceVidisConfigEmbeddableFactoryParams = MediaSourceVidisConfigEmbeddable & { encryptionKey?: string };

export const mediaSourceVidisConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceVidisConfigEmbeddable,
	MediaSourceVidisConfigEmbeddableFactoryParams
>(MediaSourceVidisConfigEmbeddable, ({ sequence, params }) => {
	const key: string = params.encryptionKey ?? 'randomKey';
	const embeddable: MediaSourceVidisConfigEmbeddable = {
		username: AesEncryptionHelper.encrypt(`media-source-client-id-${sequence}`, key),
		password: AesEncryptionHelper.encrypt(`media-source-client-secret-${sequence}`, key),
		baseUrl: 'https://media-source-endpoint.com',
		region: 'test-region',
		schoolNumberPrefix: 'NI_',
	};

	return embeddable;
});

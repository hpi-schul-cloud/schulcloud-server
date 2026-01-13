import { AesEncryptionHelper } from '@shared/common/utils';
import { BaseFactory } from '@testing/factory/base.factory';
import { MediaSourceOauthConfigEmbeddable } from '../entity';
import { MediaSourceAuthMethod } from '../enum';

type MediaSourceOauthConfigEmbeddableFactoryParams = MediaSourceOauthConfigEmbeddable & { encryptionKey?: string };

export const mediaSourceOAuthConfigEmbeddableFactory = BaseFactory.define<
	MediaSourceOauthConfigEmbeddable,
	MediaSourceOauthConfigEmbeddableFactoryParams
>(MediaSourceOauthConfigEmbeddable, ({ sequence, params }) => {
	const key: string = params.encryptionKey ?? 'randomKey';
	const embeddable: MediaSourceOauthConfigEmbeddable = {
		clientId: `media-source-client-id-${sequence}`,
		clientSecret: AesEncryptionHelper.encrypt(`media-source-client-secret-${sequence}`, key),
		authEndpoint: `https://oauth-token-url.com/test-${sequence}`,
		method: MediaSourceAuthMethod.CLIENT_CREDENTIALS,
		baseUrl: `https://oauth-base-url.com/test-${sequence}`,
	};

	return embeddable;
});

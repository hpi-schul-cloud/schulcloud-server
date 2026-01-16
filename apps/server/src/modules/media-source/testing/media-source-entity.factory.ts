import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import {
	MediaSourceEntity,
	MediaSourceEntityProps,
	MediaSourceOauthConfigEmbeddable,
	MediaSourceVidisConfigEmbeddable,
} from '../entity';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceVidisConfigEmbeddableFactory } from './media-source-basic-auth-config.embeddable.factory';
import { mediaSourceOAuthConfigEmbeddableFactory } from './media-source-oauth-config.embeddable.factory';

export class MediaSourceEntityFactory extends BaseFactory<MediaSourceEntity, MediaSourceEntityProps> {
	public withBiloFormat(
		otherParams?: DeepPartial<MediaSourceOauthConfigEmbeddable> & { encryptionKey?: string }
	): this {
		const params: DeepPartial<MediaSourceEntityProps> = {
			format: MediaSourceDataFormat.BILDUNGSLOGIN,
			oauthConfig: mediaSourceOAuthConfigEmbeddableFactory.build(otherParams),
		};

		return this.params(params);
	}

	public withVidisFormat(
		otherParams?: DeepPartial<MediaSourceVidisConfigEmbeddable> & { encryptionKey?: string }
	): this {
		const params: DeepPartial<MediaSourceEntityProps> = {
			format: MediaSourceDataFormat.VIDIS,
			vidisConfig: mediaSourceVidisConfigEmbeddableFactory.build(otherParams),
		};

		return this.params(params);
	}
}

export const mediaSourceEntityFactory = MediaSourceEntityFactory.define(MediaSourceEntity, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `media-source-${sequence}`,
		sourceId: `source-id-${sequence}`,
	};
});

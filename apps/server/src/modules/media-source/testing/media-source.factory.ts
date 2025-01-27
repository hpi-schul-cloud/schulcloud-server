import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { MediaSource, MediaSourceProps } from '../domain';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceOauthConfigFactory } from './media-source-oauth-config.factory';
import { mediaSourceVidisConfigFactory } from './media-source-vidis-config.factory';

class MediaSourceFactory extends BaseFactory<MediaSource, MediaSourceProps> {
	public withVidis(): this {
		const params: DeepPartial<MediaSourceProps> = {
			format: MediaSourceDataFormat.VIDIS,
			vidisConfig: mediaSourceVidisConfigFactory.build(),
			oauthConfig: undefined,
		};

		return this.params(params);
	}

	public withBildungslogin(): this {
		const params: DeepPartial<MediaSourceProps> = {
			format: MediaSourceDataFormat.BILDUNGSLOGIN,
			oauthConfig: mediaSourceOauthConfigFactory.build(),
			vidisConfig: undefined,
		};

		return this.params(params);
	}
}

export const mediaSourceFactory = MediaSourceFactory.define(MediaSource, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `media-source-${sequence}`,
		sourceId: `source-id-${sequence}`,
	};
});

import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@shared/testing';
import { DeepPartial } from 'fishery';
import { MediaSourceProps, MediaSource } from '../domain';
import { MediaSourceDataFormat } from '../enum';
import { mediaSourceOauthConfigFactory } from './media-source-oauth-config.factory';
import { mediaSourceBasicAuthConfigFactory } from './media-source-basic-auth-config.factory';

class MediaSourceFactory extends BaseFactory<MediaSource, MediaSourceProps> {
	public withBasicAuthConfig(): this {
		const params: DeepPartial<MediaSourceProps> = { basicAuthConfig: mediaSourceBasicAuthConfigFactory.build() };

		return this.params(params);
	}

	public withOauthConfig(): this {
		const params: DeepPartial<MediaSourceProps> = { oauthConfig: mediaSourceOauthConfigFactory.build() };

		return this.params(params);
	}
}

export const mediaSourceFactory = MediaSourceFactory.define(MediaSource, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `media-source-${sequence}`,
		sourceId: `source-id-${sequence}`,
		format: MediaSourceDataFormat.BILDUNGSLOGIN,
		oauthConfig: mediaSourceOauthConfigFactory.build(),
	};
});

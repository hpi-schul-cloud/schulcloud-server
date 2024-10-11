import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceOauthConfig } from '../domain/media-source-oauth-config';
import { MediaSourceConfigEmbeddable } from '../entity/media-source-oauth-config.embeddable';

export class MediaSourceConfigMapper {
	static mapToEntity(config: MediaSourceOauthConfig): MediaSourceConfigEmbeddable {
		const configProps = config.getProps();

		const configEmbeddable = new MediaSourceConfigEmbeddable({ ...configProps, _id: new ObjectId(configProps.id) });

		return configEmbeddable;
	}

	static mapToDo(embeddable: MediaSourceConfigEmbeddable): MediaSourceOauthConfig {
		const config = new MediaSourceOauthConfig({
			id: embeddable._id.toHexString(),
			clientId: embeddable.clientId,
			clientSecret: embeddable.clientSecret,
			method: embeddable.method,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}
}

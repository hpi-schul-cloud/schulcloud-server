import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceBasicConfig } from '../domain/media-source-basic-config';
import { MediaSourceOauthConfig } from '../domain/media-source-oauth-config';
import { MediaSourceBasicConfigEmbeddable, MediaSourceOauthConfigEmbeddable } from '../entity';

export class MediaSourceConfigMapper {
	static mapOauthConfigToEntity(config: MediaSourceOauthConfig): MediaSourceOauthConfigEmbeddable {
		const configProps = config.getProps();

		const configEmbeddable = new MediaSourceOauthConfigEmbeddable({
			_id: new ObjectId(configProps.id),
			clientId: configProps.clientId,
			clientSecret: configProps.clientSecret,
			authEndpoint: configProps.authEndpoint,
			method: configProps.method,
		});

		return configEmbeddable;
	}

	static mapBasicConfigToEntity(config: MediaSourceBasicConfig): MediaSourceBasicConfigEmbeddable {
		const configProps = config.getProps();

		const configEmbeddable = new MediaSourceBasicConfigEmbeddable({
			_id: new ObjectId(configProps.id),
			username: configProps.username,
			password: configProps.password,
			authEndpoint: configProps.authEndpoint,
		});

		return configEmbeddable;
	}

	static mapOauthConfigToDo(embeddable: MediaSourceOauthConfigEmbeddable): MediaSourceOauthConfig {
		const config = new MediaSourceOauthConfig({
			id: embeddable._id.toHexString(),
			clientId: embeddable.clientId,
			clientSecret: embeddable.clientSecret,
			method: embeddable.method,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}

	static mapBasicConfigToDo(embeddable: MediaSourceBasicConfigEmbeddable): MediaSourceBasicConfig {
		const config = new MediaSourceBasicConfig({
			id: embeddable._id.toHexString(),
			username: embeddable.username,
			password: embeddable.password,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}
}

import { ObjectId } from '@mikro-orm/mongodb';
import { MediaSourceBasicAuthConfig, MediaSourceOauthConfig } from '../domain';
import { MediaSourceBasicAuthConfigEmbeddable, MediaSourceOauthConfigEmbeddable } from '../entity';

export class MediaSourceConfigMapper {
	static mapOauthConfigToEmbeddable(config: MediaSourceOauthConfig): MediaSourceOauthConfigEmbeddable {
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

	static mapBasicAuthConfigToEmbeddable(config: MediaSourceBasicAuthConfig): MediaSourceBasicAuthConfigEmbeddable {
		const configProps = config.getProps();

		const configEmbeddable = new MediaSourceBasicAuthConfigEmbeddable({
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

	static mapBasicAuthConfigToDo(embeddable: MediaSourceBasicAuthConfigEmbeddable): MediaSourceBasicAuthConfig {
		const config = new MediaSourceBasicAuthConfig({
			id: embeddable._id.toHexString(),
			username: embeddable.username,
			password: embeddable.password,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}
}

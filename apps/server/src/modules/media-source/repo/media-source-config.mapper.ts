import { MediaSourceBasicAuthConfig, MediaSourceOauthConfig } from '../domain';
import { MediaSourceBasicAuthConfigEmbeddable, MediaSourceOauthConfigEmbeddable } from '../entity';

export class MediaSourceConfigMapper {
	public static mapOauthConfigToEmbeddable(config: MediaSourceOauthConfig): MediaSourceOauthConfigEmbeddable {
		const configEmbeddable = new MediaSourceOauthConfigEmbeddable({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			authEndpoint: config.authEndpoint,
			method: config.method,
		});

		return configEmbeddable;
	}

	public static mapBasicAuthConfigToEmbeddable(
		config: MediaSourceBasicAuthConfig
	): MediaSourceBasicAuthConfigEmbeddable {
		const configEmbeddable = new MediaSourceBasicAuthConfigEmbeddable({
			username: config.username,
			password: config.password,
			authEndpoint: config.authEndpoint,
		});

		return configEmbeddable;
	}

	public static mapOauthConfigToDo(embeddable: MediaSourceOauthConfigEmbeddable): MediaSourceOauthConfig {
		const config = new MediaSourceOauthConfig({
			clientId: embeddable.clientId,
			clientSecret: embeddable.clientSecret,
			method: embeddable.method,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}

	public static mapBasicAuthConfigToDo(embeddable: MediaSourceBasicAuthConfigEmbeddable): MediaSourceBasicAuthConfig {
		const config = new MediaSourceBasicAuthConfig({
			username: embeddable.username,
			password: embeddable.password,
			authEndpoint: embeddable.authEndpoint,
		});

		return config;
	}
}

import { MediaSourceOauthConfig, MediaSourceVidisConfig } from '../do';
import { MediaSourceOauthConfigEmbeddable, MediaSourceVidisConfigEmbeddable } from '../entity';

export class MediaSourceConfigMapper {
	public static mapOauthConfigToEmbeddable(config: MediaSourceOauthConfig): MediaSourceOauthConfigEmbeddable {
		const configEmbeddable = new MediaSourceOauthConfigEmbeddable({
			clientId: config.clientId,
			clientSecret: config.clientSecret,
			authEndpoint: config.authEndpoint,
			method: config.method,
			baseUrl: config.baseUrl,
		});

		return configEmbeddable;
	}

	public static mapVidisConfigToEmbeddable(config: MediaSourceVidisConfig): MediaSourceVidisConfigEmbeddable {
		const configEmbeddable = new MediaSourceVidisConfigEmbeddable({
			username: config.username,
			password: config.password,
			baseUrl: config.baseUrl,
			region: config.region,
			schoolNumberPrefix: config.schoolNumberPrefix,
		});

		return configEmbeddable;
	}

	public static mapOauthConfigToDo(embeddable: MediaSourceOauthConfigEmbeddable): MediaSourceOauthConfig {
		const config = new MediaSourceOauthConfig({
			clientId: embeddable.clientId,
			clientSecret: embeddable.clientSecret,
			method: embeddable.method,
			authEndpoint: embeddable.authEndpoint,
			baseUrl: embeddable.baseUrl,
		});

		return config;
	}

	public static mapVidisConfigToDo(embeddable: MediaSourceVidisConfigEmbeddable): MediaSourceVidisConfig {
		const config = new MediaSourceVidisConfig({
			username: embeddable.username,
			password: embeddable.password,
			baseUrl: embeddable.baseUrl,
			region: embeddable.region,
			schoolNumberPrefix: embeddable.schoolNumberPrefix,
		});

		return config;
	}
}

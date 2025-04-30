import { LegacyLogger } from '@core/logger';
import { ValkeyConfig, ValkeyFactory } from '@infra/valkey-client';
import KeyvValkey from '@keyv/valkey';
import { ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import { CacheConfig } from './interface';
import { KeyvValkeyAdapter } from './keyv-valkey.adapter';

export class CacheStoreFactory {
	public static async build(
		configService: ConfigService<CacheConfig>,
		logger: LegacyLogger
	): Promise<Keyv<KeyvValkey>> {
		let redisInstance: KeyvValkey | undefined;
		const config = CacheStoreFactory.buildValkeyConfig(configService);

		if (config.CLUSTER_ENABLED || config.URI) {
			const valkeyInstance = await ValkeyFactory.build(config, logger);
			redisInstance = new KeyvValkeyAdapter(valkeyInstance, { useRedisSets: false });
		} else {
			// If no redis instance is provided, we create a new in-memory store
			redisInstance = undefined;
		}

		const store = new Keyv<KeyvValkey>({ store: redisInstance, useKeyPrefix: false });

		store.on('error', (error) => logger.error(error));
		store.on('connect', (msg) => logger.log(msg));

		return store;
	}

	private static buildValkeyConfig(configService: ConfigService<CacheConfig>): ValkeyConfig {
		return {
			URI: configService.get('SESSION_VALKEY_URI', { infer: true }),
			CLUSTER_ENABLED: configService.get('SESSION_VALKEY_CLUSTER_ENABLED', { infer: true }),
			SENTINEL_NAME: configService.get('SESSION_VALKEY_SENTINEL_NAME', { infer: true }),
			SENTINEL_PASSWORD: configService.get('SESSION_VALKEY_SENTINEL_PASSWORD', { infer: true }),
			SENTINEL_SERVICE_NAME: configService.get('SESSION_VALKEY_SENTINEL_SERVICE_NAME', { infer: true }),
		};
	}
}

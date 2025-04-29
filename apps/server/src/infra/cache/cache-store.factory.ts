import { LegacyLogger } from '@core/logger';
import { ValkeyConfig, ValkeyFactory } from '@infra/valkey-client';
import KeyvValkey from '@keyv/valkey';
import { ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import { CacheConfig } from './interface';
import { KeyvValkeyAdapter } from './keyv-valkey.adapter';

export class CacheStoreFactory {
	private static logger: LegacyLogger;
	private static config: ValkeyConfig;

	public static async build(
		configService: ConfigService<CacheConfig>,
		logger: LegacyLogger
	): Promise<Keyv<KeyvValkey>> {
		CacheStoreFactory.logger = logger;
		CacheStoreFactory.logger.setContext(KeyvValkey.name);
		CacheStoreFactory.config = CacheStoreFactory.buildValkeyConfig(configService);

		let redisInstance: KeyvValkey | undefined;

		if (CacheStoreFactory.config.CLUSTER_ENABLED || CacheStoreFactory.config.URI) {
			const valkeyInstance = await ValkeyFactory.build(CacheStoreFactory.config, logger);
			redisInstance = new KeyvValkeyAdapter(valkeyInstance, { useRedisSets: false });
		} else {
			// If no redis instance is provided, we create a new in-memory store
			redisInstance = undefined;
		}

		const store = new Keyv<KeyvValkey>({ store: redisInstance, useKeyPrefix: false });

		store.on('error', (error) => CacheStoreFactory.logger.error(error));
		store.on('connect', (msg) => CacheStoreFactory.logger.log(msg));

		return store;
	}

	private static buildValkeyConfig(configService: ConfigService<CacheConfig>): ValkeyConfig {
		return {
			URI: configService.get<string>('SESSION_VALKEY_URI'),
			CLUSTER_ENABLED: configService.get<boolean>('SESSION_VALKEY_CLUSTER_ENABLED'),
			SENTINEL_NAME: configService.get<string>('SESSION_VALKEY_SENTINEL_NAME'),
			SENTINEL_PASSWORD: configService.get<string>('SESSION_VALKEY_SENTINEL_PASSWORD'),
			SENTINEL_SERVICE_NAME: configService.get<string>('SESSION_VALKEY_SENTINEL_SERVICE_NAME'),
		};
	}
}

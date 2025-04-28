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
		this.logger = logger;
		this.logger.setContext(KeyvValkey.name);
		this.config = this.buildValkeyConfig(configService);

		let redisInstance: KeyvValkey | undefined;

		if (this.config.CLUSTER_ENABLED || this.config.URI) {
			const valkeyInstance = await ValkeyFactory.build(this.config, logger);
			redisInstance = new KeyvValkeyAdapter(valkeyInstance, { useRedisSets: false });
		} else {
			// If no redis instance is provided, we create a new in-memory store
			redisInstance = undefined;
		}

		const store = new Keyv<KeyvValkey>({ store: redisInstance, useKeyPrefix: false });

		store.on('error', (error) => this.logger.error(error));
		store.on('connect', (msg) => this.logger.log(msg));

		return store;
	}

	private static buildValkeyConfig(configService: ConfigService<CacheConfig>): ValkeyConfig {
		return {
			URI: configService.get<string>('REDIS_URI'),
			CLUSTER_ENABLED: configService.get<boolean>('REDIS_CLUSTER_ENABLED'),
			SENTINEL_NAME: configService.get<string>('REDIS_SENTINEL_NAME'),
			SENTINEL_PASSWORD: configService.get<string>('REDIS_SENTINEL_PASSWORD'),
			SENTINEL_SERVICE_NAME: configService.get<string>('REDIS_SENTINEL_SERVICE_NAME'),
		};
	}
}

import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CacheModule, Module } from '@nestjs/common';
import { CacheModuleOptions } from '@nestjs/common/cache/interfaces/cache-module.interface';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { create } from 'cache-manager-redis-store';
import { RedisClient } from 'redis';
import { CacheStoreType } from './interface';
import { CacheService } from './service/cache.service';

@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: (cacheService: CacheService, logger: LegacyLogger): CacheModuleOptions => {
				if (cacheService.getStoreType() === CacheStoreType.REDIS) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const store = create({ url: redisUrl });
					const client: RedisClient = store.getClient();

					client.on('error', (error) => logger.error(error));
					client.on('connect', (msg) => logger.log(msg));

					return { store };
				}
				return {};
			},
			inject: [CacheService, LegacyLogger],
			imports: [LoggerModule, CacheWrapperModule],
		}),
	],
	providers: [CacheService],
	exports: [CacheModule, CacheService],
})
export class CacheWrapperModule {}

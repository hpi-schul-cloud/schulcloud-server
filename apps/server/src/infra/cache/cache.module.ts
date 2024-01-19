import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheStoreType } from './interface';
import { CacheService } from './service/cache.service';

@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: async (cacheService: CacheService, logger: LegacyLogger): Promise<CacheModuleOptions> => {
				if (cacheService.getStoreType() === CacheStoreType.REDIS) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const store = await redisStore({ url: redisUrl });
					const { client } = store;

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

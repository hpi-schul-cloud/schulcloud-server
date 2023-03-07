import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CacheModule, Global, Module } from '@nestjs/common';
import { CacheModuleOptions } from '@nestjs/common/cache/interfaces/cache-module.interface';
import { Logger, LoggerModule } from '@src/core/logger';
import { create } from 'cache-manager-redis-store';
import { RedisClient } from 'redis';
import { CacheStoreType } from './interface/cache-store-type.enum';
import { CacheService } from './service/cache.service';

@Global()
@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: (cacheService: CacheService, logger: Logger): CacheModuleOptions => {
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
			inject: [CacheService, Logger],
			imports: [LoggerModule],
		}),
	],
	providers: [CacheService],
	exports: [CacheModule, CacheService],
})
export class CacheWrapperModule {}

@Global()
@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: (): CacheModuleOptions => {
				return {};
			},
		}),
	],
	providers: [CacheService],
	exports: [CacheModule, CacheService],
})
export class CacheWrapperTestModule {}

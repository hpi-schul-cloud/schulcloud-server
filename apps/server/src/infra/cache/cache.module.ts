import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { redisStore, redisClusterStore } from 'cache-manager-redis-yet';
import { CacheStoreType } from './interface';
import { CacheService } from './service/cache.service';

@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: async (cacheService: CacheService, logger: LegacyLogger): Promise<CacheModuleOptions> => {
				if (cacheService.getStoreType() === CacheStoreType.REDIS) {
					if(Configuration.has('REDIS_CLUSTER_URI')) {
						const redisClusterNode0: string = Configuration.get('REDIS_CLUSTER_NODE_0_URI') as string;
						const redisClusterNode1: string = Configuration.get('REDIS_CLUSTER_NODE_1_URI') as string;
						const redisClusterNode2: string = Configuration.get('REDIS_CLUSTER_NODE_1_URI') as string;
						const storeCluster = await redisClusterStore({ rootNodes: [{ url: redisClusterNode0 }, { url: redisClusterNode1 }, { url: redisClusterNode2 } ] });
						const { client } = storeCluster;

						client.on('error', (error) => logger.error(error));
						client.on('connect', (msg) => logger.log(msg));

						return { storeCluster };
					} else {
						const redisUrl: string = Configuration.get('REDIS_URI') as string;
						const store = await redisStore({ url: redisUrl });
						const { client } = store;

						client.on('error', (error) => logger.error(error));
						client.on('connect', (msg) => logger.log(msg));

						return { store };
					}
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

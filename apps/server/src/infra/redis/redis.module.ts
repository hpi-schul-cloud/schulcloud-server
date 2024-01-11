import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { createClient, createCluster, RedisClientType, RedisClusterType, RedisClusterOptions } from 'redis';
import { REDIS_CLIENT } from './interface/redis.constants';

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: (logger: LegacyLogger) => {
				logger.setContext(RedisModule.name);
				if (Configuration.has('REDIS_CLUSTER_URI')) {
					const redisClusterNode0: string = Configuration.get('REDIS_CLUSTER_NODE_0_URI') as string;
					const redisClusterNode1: string = Configuration.get('REDIS_CLUSTER_NODE_1_URI') as string;
					const redisClusterNode2: string = Configuration.get('REDIS_CLUSTER_NODE_1_URI') as string;
					const clusterClient: RedisClusterType = createCluster({ rootNodes: [{ url: redisClusterNode0 }, { url: redisClusterNode1 }, { url: redisClusterNode2 } ] });
					  clusterClient.on('error', (error) => logger.error(error));
					  clusterClient.on('connect', (msg) => logger.log(msg));

					  return clusterClient;
				} else {
					if (Configuration.has('REDIS_URI')) {
						const redisUrl: string = Configuration.get('REDIS_URI') as string;
						const client: RedisClientType = createClient({ url: redisUrl });

						client.on('error', (error) => logger.error(error));
						client.on('connect', (msg) => logger.log(msg));

						return client;
					}
				}

				return undefined;
			},
			inject: [LegacyLogger],
		},
	],
	exports: [REDIS_CLIENT],
})
export class RedisModule {}

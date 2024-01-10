import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { createClient, createCluster, RedisClientType, RedisClusterType } from 'redis';
import { REDIS_CLIENT } from './interface/redis.constants';

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: (logger: LegacyLogger) => {
				logger.setContext(RedisModule.name);

				if (Configuration.has('REDIS_URI')) {
					if (Configuration.has('REDIS_CLUSTER_ENABLED') === true) {
						const redisUrl: string = Configuration.get('REDIS_URI') as string;
						const client: RedisClusterType = createCluster({
							rootNodes: [{
							  url: Configuration.get('REDIS_URI')
							}]
						  });
						  client.on('error', (error) => logger.error(error));
						  client.on('connect', (msg) => logger.log(msg));
  
						  return client;
					}
					else {
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

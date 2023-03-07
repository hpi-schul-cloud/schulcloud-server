import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { Logger, LoggerModule } from '@src/core/logger';
import { create } from 'cache-manager-redis-store';
import { RedisClient } from 'redis';
import { CACHE_REDIS_STORE } from './interface/redis.constants';

@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: CACHE_REDIS_STORE,
			useFactory: (logger: Logger) => {
				logger.setContext(RedisModule.name);

				if (Configuration.has('REDIS_URI')) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const store = create({ url: redisUrl });
					const client: RedisClient = store.getClient();

					client.on('error', (error) => logger.error(error));
					client.on('connect', (msg) => logger.log(msg));

					return store;
				}
				return undefined;
			},
			inject: [Logger],
		},
	],
	exports: [CACHE_REDIS_STORE],
})
export class RedisModule {}

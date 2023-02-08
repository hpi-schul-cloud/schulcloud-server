import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { createClient, RedisClient } from 'redis';
import { REDIS_CLIENT } from './interface/redis.constants';

@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: () => {
				const client: RedisClient | undefined = Configuration.has('REDIS_URI')
					? createClient({ url: Configuration.get('REDIS_URI') as string })
					: undefined;
				return client;
			},
		},
	],
	exports: [REDIS_CLIENT],
})
export class RedisModule {}

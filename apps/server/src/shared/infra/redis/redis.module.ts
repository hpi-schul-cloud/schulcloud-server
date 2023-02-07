import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { createClient } from 'redis';
import { REDIS_CLIENT } from './interface/redis.constants';

@Module({
	providers: [
		{
			provide: REDIS_CLIENT,
			useValue: createClient({ url: Configuration.get('REDIS_URI') as string }),
		},
	],
	exports: [REDIS_CLIENT],
})
export class RedisModule {}

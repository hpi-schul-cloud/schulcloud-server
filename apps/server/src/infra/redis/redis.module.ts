import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { createClient, RedisClient } from 'redis';
import { REDIS_CLIENT } from './interface/redis.constants';

// The infra module looks great, but some server specifications are placed in server
// ..what maybe is correct. But the legacy redis logout logic is completly missed.
// We must look into it with the BMBF project.
@Module({
	imports: [LoggerModule],
	providers: [
		{
			provide: REDIS_CLIENT,
			useFactory: (logger: LegacyLogger) => {
				logger.setContext(RedisModule.name);

				if (Configuration.has('REDIS_URI')) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const client: RedisClient = createClient({ url: redisUrl });

					// The error log is invalid, we need a filter ..see legacyLogger vs Logger
					client.on('error', (error) => logger.error(error));
					client.on('connect', (msg) => logger.log(msg));

					return client;
				}

				return undefined;
			},
			inject: [LegacyLogger],
		},
	],
	exports: [REDIS_CLIENT],
})
export class RedisModule {}

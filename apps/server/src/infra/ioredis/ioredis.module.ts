import { Module } from '@nestjs/common';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { IOREDIS } from '@infra/ioredis/interface/ioredis.constants';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import Redis from 'ioredis';

@Module({
	imports: [LoggerModule],
	providers: [
		{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			provide: IOREDIS,
			useFactory: (logger: LegacyLogger) => {
				logger.setContext(IoredisModule.name);

				if (Configuration.has('REDIS_URI')) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const ioredis: Redis.Redis = new Redis(redisUrl);

					ioredis.on('error', (error) => logger.error(error));
					ioredis.on('connect', (msg) => logger.log(msg));

					return ioredis;
				}

				return undefined;
			},
			inject: [LegacyLogger],
		},
	],
	exports: [IOREDIS],
})
export class IoredisModule {}

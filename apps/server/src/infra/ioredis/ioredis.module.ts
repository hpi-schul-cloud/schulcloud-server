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
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				logger.log(`Redis URI:${Configuration.get('REDIS_URI')}`);
				if (Configuration.has('REDIS_URI')) {
					const redisUrl: string = Configuration.get('REDIS_URI') as string;
					const ioredisClient = new Redis(redisUrl);

					ioredisClient.on('error', (error) => logger.error(error));
					ioredisClient.on('connect', (msg) => logger.log(msg));

					return ioredisClient;
				}

				return undefined;
			},
			inject: [LegacyLogger],
		},
	],
	exports: [IOREDIS],
})
export class IoredisModule {}

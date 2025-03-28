import { DomainErrorHandler, ErrorModule } from '@core/error';
import { LegacyLogger, LoggerModule } from '@core/logger';
import { DynamicModule, Module } from '@nestjs/common';
import { S3Config } from './interface';
import { S3ClientFactory } from './s3-client.factory';

@Module({})
export class S3ClientModule {
	public static register(configs: S3Config[]): DynamicModule {
		const providers = configs.flatMap((config) => [
			{
				provide: config.connectionName,
				useFactory: (
					clientFactory: S3ClientFactory,
					legacyLogger: LegacyLogger,
					domainErrorHandler: DomainErrorHandler
				) => clientFactory.build(config, legacyLogger, domainErrorHandler),
				inject: [S3ClientFactory, LegacyLogger, DomainErrorHandler],
			},
		]);

		return {
			module: S3ClientModule,
			imports: [LoggerModule, ErrorModule],
			providers: [...providers, S3ClientFactory],
			exports: providers,
		};
	}
}

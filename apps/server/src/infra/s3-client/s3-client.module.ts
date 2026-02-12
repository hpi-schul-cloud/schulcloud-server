import { DomainErrorHandler, ErrorModule } from '@core/error';
import { Logger, LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module } from '@nestjs/common';
import { S3ClientModuleOptions, S3Config } from './interface';
import { S3ClientFactory } from './s3-client.factory';

@Module({})
export class S3ClientModule {
	public static register(options: S3ClientModuleOptions): DynamicModule {
		const providers = [
			{
				provide: options.clientInjectionToken,
				useFactory: (config: S3Config, logger: Logger, domainErrorHandler: DomainErrorHandler) =>
					S3ClientFactory.build(config, logger, domainErrorHandler, options.clientInjectionToken),
				inject: [options.configInjectionToken, Logger, DomainErrorHandler],
			},
		];

		return {
			module: S3ClientModule,
			imports: [
				LoggerModule,
				ErrorModule,
				ConfigurationModule.register(options.configInjectionToken, options.configConstructor),
			],
			providers,
			exports: providers,
		};
	}
}

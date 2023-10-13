import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQWrapperModule } from '@shared/infra/rabbitmq';
import { S3ClientAdapter, S3ClientModule, S3Config } from '@shared/infra/s3-client';
import { createConfigModuleOptions } from '@src/config';
import { Logger, LoggerModule } from '@src/core/logger';
import { PreviewGeneratorConsumer } from './preview-generator.consumer';
import { PreviewGeneratorService } from './preview-generator.service';

const serverConfig = {
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('FILES_STORAGE__INCOMING_REQUEST_TIMEOUT') as number,
};

export const config = () => serverConfig;

@Module({})
export class PreviewGeneratorConsumerModule {
	static register(s3Config: S3Config): DynamicModule {
		const providers = [
			{
				provide: PreviewGeneratorService,
				useFactory: (logger: Logger, storageClient: S3ClientAdapter) =>
					new PreviewGeneratorService(storageClient, logger),
				inject: [Logger, s3Config.connectionName],
			},
			PreviewGeneratorConsumer,
		];

		return {
			module: PreviewGeneratorConsumerModule,
			imports: [
				LoggerModule,
				S3ClientModule.register([s3Config]),
				RabbitMQWrapperModule,
				ConfigModule.forRoot(createConfigModuleOptions(config)),
			],
			providers,
		};
	}
}

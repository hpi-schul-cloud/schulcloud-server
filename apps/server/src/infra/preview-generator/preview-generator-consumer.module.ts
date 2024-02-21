import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { S3ClientAdapter, S3ClientModule } from '@infra/s3-client';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Logger, LoggerModule } from '@src/core/logger';
import { PreviewConfig } from './interface/preview-consumer-config';
import { PreviewGeneratorConsumer } from './preview-generator.consumer';
import { PreviewGeneratorService } from './preview-generator.service';

@Module({})
export class PreviewGeneratorConsumerModule {
	static register(config: PreviewConfig): DynamicModule {
		const { storageConfig, serverConfig } = config;
		const providers = [
			{
				provide: PreviewGeneratorService,
				useFactory: (logger: Logger, storageClient: S3ClientAdapter) =>
					new PreviewGeneratorService(storageClient, logger),
				inject: [Logger, storageConfig.connectionName],
			},
			PreviewGeneratorConsumer,
		];

		return {
			module: PreviewGeneratorConsumerModule,
			imports: [
				LoggerModule,
				S3ClientModule.register([storageConfig]),
				RabbitMQWrapperModule,
				ConfigModule.forFeature(() => serverConfig),
			],
			providers,
		};
	}
}

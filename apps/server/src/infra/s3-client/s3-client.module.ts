import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { DynamicModule, Module } from '@nestjs/common';
import { S3Config } from './interface';
import { S3ClientFactory } from './s3-client.factory';

@Module({})
export class S3ClientModule {
	public static register(configs: S3Config[]): DynamicModule {
		const providers = configs.flatMap((config) => [
			{
				provide: config.connectionName,
				useFactory: (clientFactory: S3ClientFactory) => clientFactory.build(config),
				inject: [S3ClientFactory],
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

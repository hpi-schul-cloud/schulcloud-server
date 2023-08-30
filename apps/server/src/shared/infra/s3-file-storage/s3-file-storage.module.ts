import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { S3_CLIENT, S3_CONFIG } from './constants';
import { S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';

@Module({
	imports: [LoggerModule],
	providers: [S3ClientAdapter],
})
export class S3FileStorageModule {
	static register(options: S3Config): DynamicModule {
		const providers = [
			{
				provide: S3_CONFIG,
				useValue: options,
			},
			{
				provide: S3_CLIENT,
				useFactory: (config: S3Config) => {
					const { region, accessKeyId, secretAccessKey, endpoint } = config;
					return new S3Client({
						region,
						credentials: {
							accessKeyId,
							secretAccessKey,
						},
						endpoint,
						forcePathStyle: true,
						tls: true,
					});
				},
				inject: [S3_CONFIG],
			},
		];

		return {
			module: S3FileStorageModule,
			providers,
			exports: [S3ClientAdapter],
		};
	}
}

import { S3Client } from '@aws-sdk/client-s3';
import { DynamicModule, Module } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { LoggerModule } from '@src/core/logger/logger.module';
import { S3Config } from './interfaces';
import { S3ClientAdapter } from './s3-client.adapter';

const createS3ClientAdapter = (config: S3Config, legacyLogger: LegacyLogger) => {
	const { region, accessKeyId, secretAccessKey, endpoint } = config;

	const s3Client = new S3Client({
		region,
		credentials: {
			accessKeyId,
			secretAccessKey,
		},
		endpoint,
		forcePathStyle: true,
		tls: true,
	});
	return new S3ClientAdapter(s3Client, config, legacyLogger);
};

@Module({})
export class S3ClientModule {
	static register(configs: S3Config[]): DynamicModule {
		const providers = configs.flatMap((config) => [
			{
				provide: config.connectionName,
				useFactory: (logger: LegacyLogger) => createS3ClientAdapter(config, logger),
				inject: [LegacyLogger],
			},
		]);

		return {
			module: S3ClientModule,
			imports: [LoggerModule],
			providers,
			exports: providers,
		};
	}
}

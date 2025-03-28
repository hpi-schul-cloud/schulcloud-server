import { S3Client } from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy, RETRY_MODES } from '@aws-sdk/util-retry';
import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';

const MAXIMUM_ATTEMPTS = 3;
const BACKOFF_DELAY_TIME_MS = 5000;

export class S3ClientFactory {
	public build(config: S3Config, legacyLogger: LegacyLogger, domainErrorHandler: DomainErrorHandler): S3ClientAdapter {
		const { region, accessKeyId, secretAccessKey, endpoint } = config;
		const retryStrategy = new ConfiguredRetryStrategy(
			MAXIMUM_ATTEMPTS,
			(attempt: number) => attempt * BACKOFF_DELAY_TIME_MS
		);

		const s3Client = new S3Client({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			endpoint,
			forcePathStyle: true,
			tls: true,
			retryMode: RETRY_MODES.STANDARD,
			retryStrategy,
		});

		return new S3ClientAdapter(s3Client, config, legacyLogger, domainErrorHandler);
	}
}

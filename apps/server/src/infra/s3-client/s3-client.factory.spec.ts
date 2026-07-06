import { S3Client } from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy, RETRY_MODES } from '@aws-sdk/util-retry';
import { createMock } from '@golevelup/ts-jest';
import { DomainErrorHandler } from '@infra/error';
import { Logger } from '@infra/logger';
import { S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3ClientFactory } from './s3-client.factory';

jest.mock('@aws-sdk/client-s3');
jest.mock('./s3-client.adapter');

const setup = () => {
	const bucket = 'test-bucket';
	const clientInjectionToken = 'TEST_CONNECTION';
	const config: S3Config = {
		endpoint: '',
		region: '',
		bucket,
		accessKeyId: '',
		secretAccessKey: '',
	};
	const logger = createMock<Logger>();
	const errorHandler = createMock<DomainErrorHandler>();
	const client = createMock<S3Client>();

	return { config, bucket, logger, errorHandler, client, clientInjectionToken };
};

describe(S3ClientFactory.name, () => {
	describe('build', () => {
		it('should create S3Client with correctly config', () => {
			const { config, logger, errorHandler, clientInjectionToken } = setup();
			S3ClientFactory.build(config, logger, errorHandler, clientInjectionToken);

			expect(S3Client).toHaveBeenCalledWith({
				region: config.region,
				credentials: {
					accessKeyId: config.accessKeyId,
					secretAccessKey: config.secretAccessKey,
				},
				endpoint: config.endpoint,
				forcePathStyle: true,
				tls: true,
				retryMode: RETRY_MODES.STANDARD,
				retryStrategy: expect.any(ConfiguredRetryStrategy),
			});
		});

		it('should create S3ClientAdapter with correctly config', () => {
			const { config, logger, errorHandler, client, clientInjectionToken } = setup();
			S3ClientFactory.build(config, logger, errorHandler, clientInjectionToken);

			expect(S3ClientAdapter).toHaveBeenCalledWith(client, config, logger, errorHandler, clientInjectionToken);
		});

		it('should return an instance of S3ClientAdapter', () => {
			const { config, logger, errorHandler, clientInjectionToken } = setup();
			const result = S3ClientFactory.build(config, logger, errorHandler, clientInjectionToken);

			expect(result).toBeInstanceOf(S3ClientAdapter);
		});
	});
});

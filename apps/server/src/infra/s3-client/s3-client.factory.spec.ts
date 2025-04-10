import { S3Client } from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy, RETRY_MODES } from '@aws-sdk/util-retry';
import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { createMock } from '@golevelup/ts-jest';
import { S3Config } from './interface';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3ClientFactory } from './s3-client.factory';

jest.mock('@aws-sdk/client-s3');
jest.mock('./s3-client.adapter');

const setup = () => {
	const bucket = 'test-bucket';
	const config = {
		connectionName: 'test-connection',
		endpoint: '',
		region: '',
		bucket,
		accessKeyId: '',
		secretAccessKey: '',
	};
	const logger = createMock<LegacyLogger>();
	const configuration = createMock<S3Config>();
	const errorHandler = createMock<DomainErrorHandler>();
	const client = createMock<S3Client>();

	return { config, bucket, logger, configuration, errorHandler, client };
};

describe(S3ClientFactory.name, () => {
	let service: S3ClientFactory;

	beforeAll(() => {
		service = new S3ClientFactory();
	});

	afterEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('build', () => {
		it('should create S3Client with correctly config', () => {
			const { config, logger, errorHandler } = setup();
			service.build(config, logger, errorHandler);

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
			const { config, logger, errorHandler, client } = setup();
			service.build(config, logger, errorHandler);

			expect(S3ClientAdapter).toHaveBeenCalledWith(client, config, logger, errorHandler);
		});

		it('should return an instance of S3ClientAdapter', () => {
			const { config, logger, errorHandler } = setup();
			const result = service.build(config, logger, errorHandler);

			expect(result).toBeInstanceOf(S3ClientAdapter);
		});
	});
});

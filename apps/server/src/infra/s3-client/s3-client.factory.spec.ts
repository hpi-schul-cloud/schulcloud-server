import { S3Client } from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy, RETRY_MODES } from '@aws-sdk/util-retry';
import { DomainErrorHandler } from '@core/error';
import { LegacyLogger } from '@core/logger';
import { Test, TestingModule } from '@nestjs/testing';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3ClientFactory } from './s3-client.factory';

jest.mock('@aws-sdk/client-s3');
jest.mock('./s3-client.adapter');
jest.mock('@core/error');
jest.mock('@core/logger');

const createParameter = () => {
	const bucket = 'test-bucket';
	const config = {
		connectionName: 'test-connection',
		endpoint: '',
		region: '',
		bucket,
		accessKeyId: '',
		secretAccessKey: '',
	};

	return { config, bucket };
};

describe(S3ClientFactory.name, () => {
	let module: TestingModule;
	let service: S3ClientFactory;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [S3ClientFactory, DomainErrorHandler, LegacyLogger],
		}).compile();

		service = module.get(S3ClientFactory);
	});

	afterAll(async () => {
		await module.close();
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
			const { config } = createParameter();
			service.build(config);

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
			const { config } = createParameter();
			service.build(config);

			expect(S3ClientAdapter).toHaveBeenCalledWith(
				expect.any(S3Client),
				config,
				expect.any(LegacyLogger),
				expect.any(DomainErrorHandler)
			);
		});

		it('should return an instance of S3ClientAdapter', () => {
			const { config } = createParameter();
			const result = service.build(config);

			expect(result).toBeInstanceOf(S3ClientAdapter);
		});
	});
});

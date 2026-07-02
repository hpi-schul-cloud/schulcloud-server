import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Inject } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { S3ClientAdapter } from './s3-client.adapter';
import { S3ClientModule } from './s3-client.module';
import {
	TEST_S3_CLIENT_ONE_CONFIG_TOKEN,
	TEST_S3_CLIENT_ONE_INJECTION_TOKEN,
	TEST_S3_CLIENT_TWO_CONFIG_TOKEN,
	TEST_S3_CLIENT_TWO_INJECTION_TOKEN,
	TestS3ClientConfigOne,
	TestS3ClientConfigTwo,
} from './testing/test-s3-client.config';

class OneService {
	constructor(@Inject(TEST_S3_CLIENT_ONE_INJECTION_TOKEN) public s3client: S3ClientAdapter) {}
}
class TwoService {
	constructor(@Inject(TEST_S3_CLIENT_TWO_INJECTION_TOKEN) public s3client: S3ClientAdapter) {}
}

describe('S3ClientModule', () => {
	let module: TestingModule;
	let s3ClientAdapterOne: S3ClientAdapter;
	let s3ClientAdapterTwo: S3ClientAdapter;
	let serviceOne: OneService;
	let serviceTwo: TwoService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				S3ClientModule.register({
					clientInjectionToken: TEST_S3_CLIENT_ONE_INJECTION_TOKEN,
					configInjectionToken: TEST_S3_CLIENT_ONE_CONFIG_TOKEN,
					configConstructor: TestS3ClientConfigOne,
				}),
				S3ClientModule.register({
					clientInjectionToken: TEST_S3_CLIENT_TWO_INJECTION_TOKEN,
					configInjectionToken: TEST_S3_CLIENT_TWO_CONFIG_TOKEN,
					configConstructor: TestS3ClientConfigTwo,
				}),
			],
			providers: [
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				OneService,
				TwoService,
			],
		}).compile();

		s3ClientAdapterOne = module.get(TEST_S3_CLIENT_ONE_INJECTION_TOKEN);
		s3ClientAdapterTwo = module.get(TEST_S3_CLIENT_TWO_INJECTION_TOKEN);
		serviceOne = module.get(OneService);
		serviceTwo = module.get(TwoService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when connectionOne is initialized with register method', () => {
		it('should be defined', () => {
			expect(s3ClientAdapterOne).toBeDefined();
		});

		it('should has correctly connection', () => {
			// @ts-expect-error this is a private property
			expect(s3ClientAdapterOne.config).toBeInstanceOf(TestS3ClientConfigOne);
		});
	});

	describe('when connectionTwo is initialized with register method', () => {
		it('should be defined', () => {
			expect(s3ClientAdapterTwo).toBeDefined();
		});

		it('should has correctly connection', () => {
			// @ts-expect-error this is a private property
			expect(s3ClientAdapterTwo.config).toBeInstanceOf(TestS3ClientConfigTwo);
		});
	});

	describe('OneService', () => {
		describe('when connectionOne is injected', () => {
			it('should has injected s3ClientAdapterOne', () => {
				expect(serviceOne.s3client).toBe(s3ClientAdapterOne);
			});
			it('should has injected s3ClientAdapterOne with correct config', () => {
				// @ts-expect-error this is a private property
				expect(serviceOne.s3client.config).toBeInstanceOf(TestS3ClientConfigOne);
			});
		});
	});

	describe('TwoService', () => {
		describe('when connectionTwo is injected', () => {
			it('should has injected s3ClientAdapterTwo', () => {
				expect(serviceTwo.s3client).toBe(s3ClientAdapterTwo);
			});
			it('should has injected s3ClientAdapterTwo with correct config', () => {
				// @ts-expect-error this is a private property
				expect(serviceTwo.s3client.config).toBeInstanceOf(TestS3ClientConfigTwo);
			});
		});
	});
});

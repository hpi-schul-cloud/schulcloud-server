import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@src/core/logger';
import { AuthorizationService } from '@src/modules/authorization';
import { FwuLearningContentsUc } from './fwu-learning-contents.uc';

describe('FwuLearningContentsUC', () => {
	let module: TestingModule;
	let fwuLearningContentsUc: FwuLearningContentsUc;
	let authorizationService: AuthorizationService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FwuLearningContentsUc,
				{
					provide: S3Client,
					useValue: createMock<S3Client>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		fwuLearningContentsUc = module.get(FwuLearningContentsUc);
		authorizationService = module.get(AuthorizationService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(fwuLearningContentsUc).toBeDefined();
	});

	describe('get is called', () => {
		describe('when user is authorised and valid files exist' () => {

		})
	})
})
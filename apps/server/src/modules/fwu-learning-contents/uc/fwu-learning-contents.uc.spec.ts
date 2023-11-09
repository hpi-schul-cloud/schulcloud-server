import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { S3ClientAdapter } from '@shared/infra/s3-client';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import { FWU_CONTENT_S3_CONNECTION } from '../fwu-learning-contents.config';
import { FwuLearningContentsUc } from './fwu-learning-contents.uc';

describe('FwuLearningContentsUC', () => {
	const createParameter = () => {
		const config = {
			endpoint: '',
			region: '',
			bucket: 'test-bucket',
			accessKeyId: '',
			secretAccessKey: '',
		};
		const pathToFile = 'test/text.txt';
		return { config, pathToFile };
	};
	let module: TestingModule;
	let fwuLearningContentsUc: FwuLearningContentsUc;
	let s3client: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FwuLearningContentsUc,
				{
					provide: FWU_CONTENT_S3_CONNECTION,
					useValue: createMock<S3ClientAdapter>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		fwuLearningContentsUc = module.get(FwuLearningContentsUc);
		s3client = module.get(FWU_CONTENT_S3_CONNECTION);
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
		describe('when user is authorised and valid files exist', () => {
			const setup = () => {
				const { pathToFile, config } = createParameter();

				const resultObj = {
					$metadata: {
						httpStatusCode: 200,
					},
					Body: Readable.from([new Uint8Array()]),
				};

				// @ts-expect-error Testcase
				s3client.get.mockResolvedValueOnce(resultObj);

				return { pathToFile, config };
			};

			it('should return file', async () => {
				const { pathToFile } = setup();

				const result = await fwuLearningContentsUc.get(pathToFile);

				expect(result).toBeInstanceOf(Object);
			});

			it('should call get() of client', async () => {
				const { pathToFile } = setup();

				await fwuLearningContentsUc.get(pathToFile);

				expect(s3client.get).toBeCalledWith(pathToFile, undefined);
			});
		});
	});
});

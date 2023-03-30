import { S3Client } from '@aws-sdk/client-s3';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { Readable } from 'stream';
import { S3Config } from '../interface/config';
import { FwuLearningContentsUc } from './fwu-learning-contents.uc';

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

describe('FwuLearningContentsUC', () => {
	let module: TestingModule;
	let fwuLearningContentsUc: FwuLearningContentsUc;
	let s3client: DeepMocked<S3Client>;

	beforeAll(async () => {
		const { config } = createParameter();

		module = await Test.createTestingModule({
			providers: [
				FwuLearningContentsUc,
				{
					provide: 'FWU_S3_Client',
					useValue: createMock<S3Client>(),
				},
				{
					provide: 'S3_Config',
					useValue: createMock<S3Config>(config),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		fwuLearningContentsUc = module.get(FwuLearningContentsUc);
		s3client = module.get('FWU_S3_Client');
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
				s3client.send.mockResolvedValueOnce(resultObj);

				return { pathToFile, config };
			};

			it('should return file', async () => {
				const { pathToFile } = setup();

				const result = await fwuLearningContentsUc.get(pathToFile);

				expect(result).toBeInstanceOf(Uint8Array);
			});

			it('should call send() of client', async () => {
				const { pathToFile, config } = setup();

				await fwuLearningContentsUc.get(pathToFile);

				expect(s3client.send).toBeCalledWith(
					expect.objectContaining({
						input: {
							Bucket: config.bucket,
							Key: pathToFile,
						},
					})
				);
			});
		});

		describe('when client throws error', () => {
			const setup = <ErrorType>(error: ErrorType) => {
				const { pathToFile } = createParameter();

				// @ts-expect-error Testcase
				s3client.send.mockRejectedValueOnce(error);

				return { error, pathToFile };
			};

			it('should throw NotFoundException', async () => {
				const { pathToFile } = setup({ name: 'NoSuchKey', stack: 'NoSuchKey at ...' });

				await expect(fwuLearningContentsUc.get(pathToFile)).rejects.toThrowError(NotFoundException);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup({ name: 'UnknownError' });

				await expect(fwuLearningContentsUc.get(pathToFile)).rejects.toThrowError(InternalServerErrorException);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup('Not an Error object');

				await expect(fwuLearningContentsUc.get(pathToFile)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('getContentType is called', () => {
		describe('when user is authorised and valid files exist', () => {
			const setup = () => {
				const { pathToFile, config } = createParameter();

				const resultObj = {
					$metadata: {
						httpStatusCode: 200,
					},
					ContentType: 'text/html',
					Body: Readable.from([new Uint8Array()]),
				};

				// @ts-expect-error Testcase
				s3client.send.mockResolvedValueOnce(resultObj);

				return { pathToFile, config };
			};

			it('should return file', async () => {
				const { pathToFile } = setup();

				const result = await fwuLearningContentsUc.getContentType(pathToFile);

				expect(typeof result).toBe('string');
			});

			it('should call send() of client', async () => {
				const { pathToFile, config } = setup();

				await fwuLearningContentsUc.getContentType(pathToFile);

				expect(s3client.send).toBeCalledWith(
					expect.objectContaining({
						input: {
							Bucket: config.bucket,
							Key: pathToFile,
						},
					})
				);
			});
		});

		describe('when client throws error', () => {
			const setup = <ErrorType>(error: ErrorType) => {
				const { pathToFile } = createParameter();

				// @ts-expect-error Testcase
				s3client.send.mockRejectedValueOnce(error);

				return { error, pathToFile };
			};

			it('should throw NotFoundException', async () => {
				const { pathToFile } = setup({ name: 'NoSuchKey', stack: 'NoSuchKey at ...' });

				await expect(fwuLearningContentsUc.getContentType(pathToFile)).rejects.toThrowError(NotFoundException);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup({ name: 'UnknownError', stack: 'NoSuchKey at ...' });

				await expect(fwuLearningContentsUc.getContentType(pathToFile)).rejects.toThrowError(
					InternalServerErrorException
				);
			});

			it('should throw error', async () => {
				const { pathToFile } = setup('Not an Error object');

				await expect(fwuLearningContentsUc.getContentType(pathToFile)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});
	});
});

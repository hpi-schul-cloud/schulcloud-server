import { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { S3ClientAdapter } from '@infra/s3-client';
import { HttpException, InternalServerErrorException, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReadStream } from 'fs';
import { Readable } from 'node:stream';
import { GetH5PFileResponse } from '../controller/dto';
import { H5P_CONTENT_S3_CONNECTION } from '../h5p-editor.config';
import { TemporaryFileStorage } from './temporary-file-storage.service';

const helpers = {
	createUser() {
		return {
			email: 'example@schul-cloud.org',
			id: '12345',
			name: 'Example User',
			type: 'user',
		};
	},
};

describe('TemporaryFileStorage', () => {
	let module: TestingModule;
	let storage: TemporaryFileStorage;
	let s3clientAdapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TemporaryFileStorage,
				{ provide: H5P_CONTENT_S3_CONNECTION, useValue: createMock<S3ClientAdapter>() },
			],
		}).compile();
		storage = module.get(TemporaryFileStorage);
		s3clientAdapter = module.get(H5P_CONTENT_S3_CONNECTION);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('service should be defined', () => {
		expect(storage).toBeDefined();
	});

	describe('deleteFile is called', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const user = helpers.createUser();
			const userID = user.id;

			const deleteError = new Error('Could not delete');

			return {
				deleteError,
				filename,
				invalidFilename,
				user,
				userID,
			};
		};

		describe('WHEN file exists', () => {
			it('should delete file', async () => {
				const { userID, filename } = setup();
				const res = [`h5p-tempfiles/${userID}/${filename}`];

				await storage.deleteFile(filename, userID);

				expect(s3clientAdapter.delete).toHaveBeenCalledTimes(1);
				expect(s3clientAdapter.delete).toHaveBeenCalledWith(res);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { userID, invalidFilename } = setup();

				const deletePromise = storage.deleteFile(invalidFilename, userID);

				await expect(deletePromise).rejects.toThrow();
			});
		});

		describe('WHEN S3ClientAdapter throws an error', () => {
			it('should throw along the error', async () => {
				const { userID, filename, deleteError } = setup();
				s3clientAdapter.delete.mockRejectedValueOnce(deleteError);

				const deletePromise = storage.deleteFile(userID, filename);

				await expect(deletePromise).rejects.toBe(deleteError);
			});
		});
	});

	describe('fileExists is called', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const user = helpers.createUser();
			const userID = user.id;

			const deleteError = new Error('Could not delete');

			return {
				deleteError,
				filename,
				invalidFilename,
				user,
				userID,
			};
		};

		describe('WHEN file exists', () => {
			it('should return true', async () => {
				const { user, filename } = setup();
				s3clientAdapter.head.mockResolvedValueOnce(createMock());

				const exists = await storage.fileExists(filename, user);

				expect(exists).toBe(true);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { user, filename } = setup();
				s3clientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));

				const exists = await storage.fileExists(filename, user);

				expect(exists).toBe(false);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw HttpException', async () => {
				const { user, filename } = setup();
				s3clientAdapter.get.mockRejectedValueOnce(new Error());

				const existsPromise = storage.fileExists(filename, user);

				await expect(existsPromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { user, invalidFilename } = setup();

				const existsPromise = storage.fileExists(invalidFilename, user);

				await expect(existsPromise).rejects.toThrow();
			});
		});
	});

	describe('getFileStats', () => {
		const setup = () => {
			const filename = 'file.txt';

			const user = helpers.createUser();
			const userID = user.id;

			const birthtime = new Date();
			const size = 100;

			const headResponse = createMock<HeadObjectCommandOutput>({
				ContentLength: size,
				LastModified: birthtime,
			});

			const headResponseWithoutContentLength = createMock<HeadObjectCommandOutput>({
				ContentLength: undefined,
				LastModified: birthtime,
			});

			const headResponseWithoutLastModified = createMock<HeadObjectCommandOutput>({
				ContentLength: size,
				LastModified: undefined,
			});

			const headError = new Error('Head');

			return {
				size,
				birthtime,
				userID,
				filename,
				user,
				headResponse,
				headResponseWithoutContentLength,
				headResponseWithoutLastModified,
				headError,
			};
		};

		describe('WHEN file exists', () => {
			it('should return file stats', async () => {
				const { filename, user, headResponse, size, birthtime } = setup();
				s3clientAdapter.head.mockResolvedValueOnce(headResponse);

				const stats = await storage.getFileStats(filename, user);

				expect(stats).toEqual(
					expect.objectContaining({
						birthtime,
						size,
					})
				);
			});
		});

		describe('WHEN response from S3 is missing ContentLength field', () => {
			it('should throw InternalServerError', async () => {
				const { filename, user, headResponseWithoutContentLength } = setup();
				s3clientAdapter.head.mockResolvedValueOnce(headResponseWithoutContentLength);

				const statsPromise = storage.getFileStats(filename, user);

				await expect(statsPromise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('WHEN response from S3 is missing LastModified field', () => {
			it('should throw InternalServerError', async () => {
				const { filename, user, headResponseWithoutLastModified } = setup();
				s3clientAdapter.head.mockResolvedValueOnce(headResponseWithoutLastModified);

				const statsPromise = storage.getFileStats(filename, user);

				await expect(statsPromise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw the error', async () => {
				const { filename, user, headError } = setup();
				s3clientAdapter.head.mockRejectedValueOnce(headError);

				const statsPromise = storage.getFileStats(filename, user);

				await expect(statsPromise).rejects.toBe(headError);
			});
		});
	});

	describe('getFileStream is called', () => {
		const setup = () => {
			const filename = 'testfile.txt';
			const fileStream = Readable.from('content');
			const fileResponse = createMock<GetH5PFileResponse>({ data: fileStream });
			const user = helpers.createUser();
			const userID = user.id;

			const getError = new Error('Could not get file');

			// [start, end, expected range]
			const testRanges = [
				[undefined, undefined, undefined],
				[100, undefined, undefined],
				[undefined, 100, undefined],
				[100, 999, 'bytes=100-999'],
			] as const;

			return { filename, userID, fileStream, fileResponse, testRanges, user, getError };
		};

		describe('WHEN file exists', () => {
			it('should S3ClientAdapter.get with range', async () => {
				const { testRanges, filename, user, fileResponse } = setup();

				for (const range of testRanges) {
					s3clientAdapter.get.mockResolvedValueOnce(fileResponse);

					// eslint-disable-next-line no-await-in-loop
					await storage.getFileStream(filename, user, range[0], range[1]);

					expect(s3clientAdapter.get).toHaveBeenCalledWith(expect.stringContaining(filename), range[2]);
				}
			});

			it('should return stream from S3ClientAdapter', async () => {
				const { fileStream, filename, user, fileResponse } = setup();
				s3clientAdapter.get.mockResolvedValueOnce(fileResponse);

				const stream = await storage.getFileStream(filename, user);

				expect(stream).toBe(fileStream);
			});
		});

		describe('WHEN S3ClientAdapter.get throws error', () => {
			it('should throw the error', async () => {
				const { filename, user, getError } = setup();
				s3clientAdapter.get.mockRejectedValueOnce(getError);

				const streamPromise = storage.getFileStream(filename, user);

				await expect(streamPromise).rejects.toBe(getError);
			});
		});
	});

	describe('listFiles is called', () => {
		const setup = () => {
			const user = helpers.createUser();

			return { user };
		};

		describe('WHEN user is given', () => {
			it('should return empty array', async () => {
				const { user } = setup();
				const files = await storage.listFiles(user);

				expect(files).toHaveLength(0);
			});
		});

		describe('WHEN no user is given', () => {
			it('should return empty array', async () => {
				const files = await storage.listFiles();

				expect(files).toHaveLength(0);
			});
		});
	});

	describe('saveFile is called', () => {
		const setup = () => {
			const filename = 'filename.txt';
			const invalidFilename = '..test.txt';
			const stream = Readable.from('content') as ReadStream;

			const user = helpers.createUser();
			const userID = user.id;

			const fileDeleteError = new Error('Could not delete file');
			const fileCreateError = new Error('Could not create file');

			const recentDate = faker.date.recent();
			const soonDate = faker.date.soon();

			return {
				filename,
				invalidFilename,
				stream,
				user,
				userID,
				fileDeleteError,
				fileCreateError,
				recentDate,
				soonDate,
			};
		};

		describe('WHEN saving a valid files', () => {
			it('should call s3client.create', async () => {
				const { filename, stream, user, soonDate } = setup();

				await storage.saveFile(filename, stream, user, soonDate);

				expect(s3clientAdapter.create).toHaveBeenCalledWith(
					expect.stringContaining(filename),
					expect.objectContaining({
						name: filename,
						data: stream,
						mimeType: 'application/octet-stream',
					})
				);
			});

			it('should return ITemporaryFile', async () => {
				const { filename, stream, user, soonDate } = setup();

				const result = await storage.saveFile(filename, stream, user, soonDate);

				expect(result).toEqual({
					expiresAt: soonDate,
					filename,
					ownedByUserId: user.id,
				});
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { user, invalidFilename } = setup();

				const existsPromise = storage.fileExists(invalidFilename, user);

				await expect(existsPromise).rejects.toThrow();
			});
		});

		describe('WHEN expiration is in the past', () => {
			it('should throw NotAcceptableAcception', async () => {
				const { filename, stream, user, recentDate } = setup();

				const savePromise = storage.saveFile(filename, stream, user, recentDate);

				await expect(savePromise).rejects.toThrow(NotAcceptableException);
			});
		});

		describe('WHEN S3ClientAdapter throws error', () => {
			it('should throw the error', async () => {
				const { filename, stream, fileCreateError, user, soonDate } = setup();
				s3clientAdapter.create.mockRejectedValueOnce(fileCreateError);

				const addFilePromise = storage.saveFile(filename, stream, user, soonDate);

				await expect(addFilePromise).rejects.toBe(fileCreateError);
			});
		});
	});
});

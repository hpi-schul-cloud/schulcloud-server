import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IUser } from '@lumieducation/h5p-server';
import { Test, TestingModule } from '@nestjs/testing';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { FileDto } from '@src/modules/files-storage/dto';
import { IGetFileResponse } from '@src/modules/files-storage/interface';
import { ReadStream } from 'fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { TemporaryFile } from '../entity/temporary-file.entity';
import { TemporaryFileRepo } from '../repo/temporary-file.repo';
import { TemporaryFileStorage } from './temporary-file-storage.service';

const today = new Date();
const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

describe('TemporaryFileStorage', () => {
	let module: TestingModule;
	let storage: TemporaryFileStorage;
	let s3clientAdapter: DeepMocked<S3ClientAdapter>;
	let repo: DeepMocked<TemporaryFileRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TemporaryFileStorage,
				{
					provide: TemporaryFileRepo,
					useValue: createMock<TemporaryFileRepo>(),
				},
				{
					provide: 'S3ClientAdapter_Content',
					useValue: createMock<S3ClientAdapter>(),
				},
			],
		}).compile();
		storage = module.get(TemporaryFileStorage);
		s3clientAdapter = module.get('S3ClientAdapter_Content');
		repo = module.get(TemporaryFileRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	const fileContent = (userId: string, filename: string) => `Test content of ${userId}'s ${filename}`;

	const setup = () => {
		const user1: Required<IUser> = {
			email: 'user1@example.org',
			id: '12345-12345',
			name: 'Marla Mathe',
			type: 'local',
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
		};
		const filename1 = 'abc/def.txt';
		const file1 = new TemporaryFile({
			filename: filename1,
			ownedByUserId: user1.id,
			expiresAt: tomorrow,
			birthtime: new Date(),
			size: fileContent(user1.id, filename1).length,
		});

		const user2: Required<IUser> = {
			email: 'user2@example.org',
			id: '54321-54321',
			name: 'Mirjam Mathe',
			type: 'local',
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
		};
		const filename2 = 'uvw/xyz.txt';
		const file2 = new TemporaryFile({
			filename: filename2,
			ownedByUserId: user2.id,
			expiresAt: tomorrow,
			birthtime: new Date(),
			size: fileContent(user2.id, filename2).length,
		});

		return {
			user1,
			user2,
			file1,
			file2,
		};
	};

	it('service should be defined', () => {
		expect(storage).toBeDefined();
	});

	describe('deleteFile is called', () => {
		describe('WHEN file exists', () => {
			it('should delete file', async () => {
				const { user1, file1 } = setup();
				repo.findByUserAndFilename.mockResolvedValueOnce(file1);

				await storage.deleteFile(file1.filename, user1.id);

				expect(repo.delete).toHaveBeenCalled();
				expect(s3clientAdapter.delete).toHaveBeenCalledWith([join('h5p-tempfiles', user1.id, file1.filename)]);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user1, file1 } = setup();
				repo.findByUserAndFilename.mockImplementation(() => {
					throw new Error('Not found');
				});

				await expect(async () => {
					await storage.deleteFile(file1.filename, user1.id);
				}).rejects.toThrow();

				expect(repo.delete).not.toHaveBeenCalled();
				expect(s3clientAdapter.delete).not.toHaveBeenCalled();
			});
		});
	});

	describe('fileExists is called', () => {
		describe('WHEN file exists', () => {
			it('should return true', async () => {
				const { user1, file1 } = setup();
				repo.findByUserAndFilename.mockResolvedValueOnce(file1);

				const result = await storage.fileExists(file1.filename, user1);

				expect(result).toBe(true);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { user1 } = setup();
				repo.findByUserAndFilename.mockRejectedValueOnce(new Error('Not found'));

				const exists = await storage.fileExists('abc/nonexistingfile.txt', user1);

				expect(exists).toBe(false);
			});
		});
	});

	describe('getFileStats is called', () => {
		describe('WHEN file exists', () => {
			it('should return file stats', async () => {
				const { user1, file1 } = setup();
				repo.findByUserAndFilename.mockResolvedValueOnce(file1);

				const filestats = await storage.getFileStats(file1.filename, user1);

				expect(filestats.size).toBe(file1.size);
				expect(filestats.birthtime).toBe(file1.birthtime);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user1 } = setup();
				repo.findByUserAndFilename.mockImplementation(() => {
					throw new Error('Not found');
				});

				const fileStatsPromise = storage.getFileStats('abc/nonexistingfile.txt', user1);

				await expect(fileStatsPromise).rejects.toThrow();
			});
		});
	});

	describe('getFileStream is called', () => {
		describe('WHEN file exists and no range is given', () => {
			it('should return readable file stream', async () => {
				const { user1, file1 } = setup();
				const actualContent = fileContent(user1.id, file1.filename);
				const response: Required<IGetFileResponse> = {
					data: Readable.from(actualContent),
					contentType: undefined,
					contentLength: undefined,
					contentRange: undefined,
					etag: undefined,
					name: 'a',
				};
				repo.findByUserAndFilename.mockResolvedValueOnce(file1);
				s3clientAdapter.get.mockResolvedValueOnce(response);

				const stream = await storage.getFileStream(file1.filename, user1);

				let content = Buffer.alloc(0);
				await new Promise((resolve, reject) => {
					stream.on('data', (chunk) => {
						content += chunk;
					});
					stream.on('error', reject);
					stream.on('end', resolve);
				});

				expect(content).not.toBe(null);
				expect(content.toString()).toEqual(actualContent);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user1 } = setup();
				repo.findByUserAndFilename.mockImplementation(() => {
					throw new Error('Not found');
				});

				const fileStreamPromise = storage.getFileStream('abc/nonexistingfile.txt', user1);

				await expect(fileStreamPromise).rejects.toThrow();
			});
		});
	});

	describe('listFiles is called', () => {
		describe('WHEN existing user is given', () => {
			it('should return only users file', async () => {
				const { user1, file1 } = setup();
				repo.findByUser.mockResolvedValueOnce([file1]);

				const files = await storage.listFiles(user1);

				expect(files.length).toBe(1);
				expect(files[0].ownedByUserId).toBe(user1.id);
				expect(files[0].filename).toBe(file1.filename);
			});
		});
		describe('WHEN no user is given', () => {
			it('should return all expired files)', async () => {
				const { user1, user2, file1, file2 } = setup();
				repo.findExpired.mockResolvedValueOnce([file1, file2]);

				const files = await storage.listFiles();

				expect(files.length).toBe(2);
				expect(files[0].ownedByUserId).toBe(user1.id);
				expect(files[1].ownedByUserId).toBe(user2.id);
			});
		});
	});

	describe('saveFile is called', () => {
		describe('WHEN file exists', () => {
			it('should overwrite file', async () => {
				const { user1, file1 } = setup();
				const newData = 'This is new fake H5P content.';
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const readStream = Readable.from(newData) as ReadStream;
				repo.findByUserAndFilename.mockResolvedValueOnce(file1);
				let savedData = Buffer.alloc(0);
				s3clientAdapter.create.mockImplementation(async (path: string, file: FileDto) => {
					savedData += file.data.read();
					return Promise.resolve({} as ServiceOutputTypes);
				});

				await storage.saveFile(file1.filename, readStream, user1, tomorrow);

				expect(s3clientAdapter.delete).toHaveBeenCalled();
				expect(savedData.toString()).toBe(newData);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should create new file', async () => {
				const { user1 } = setup();
				const filename = 'newfile.txt';
				const newData = 'This is new fake H5P content.';
				const readStream = Readable.from(newData) as ReadStream;
				repo.findByUserAndFilename.mockImplementation(() => {
					throw new Error('Not found');
				});
				let savedData = Buffer.alloc(0);
				s3clientAdapter.create.mockImplementation(async (path: string, file: FileDto) => {
					savedData += file.data.read();
					return Promise.resolve({} as ServiceOutputTypes);
				});

				await storage.saveFile(filename, readStream, user1, tomorrow);

				expect(s3clientAdapter.delete).not.toHaveBeenCalled();
				expect(savedData.toString()).toBe(newData);
			});
		});

		describe('WHEN expirationTime is in the past', () => {
			it('should throw error', async () => {
				const { user1, file1 } = setup();
				const newData = 'This is new fake H5P content.';
				const readStream = Readable.from(newData) as ReadStream;

				const saveFile = storage.saveFile(file1.filename, readStream, user1, new Date(2023, 0, 1));

				await expect(saveFile).rejects.toThrow();
			});
		});
	});
});

import { ReadStream } from 'fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceOutputTypes } from '@aws-sdk/client-s3';
import { IUser } from '@lumieducation/h5p-server';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { IGetFileResponse } from '@src/modules/files-storage/interface';
import { FileDto } from '@src/modules/files-storage/dto';
import { TemporaryFileStorage } from './temporary-file-storage';
import { TemporaryFile } from './temporary-file.entity';
import { TemporaryFileRepo } from './temporary-file.repo';

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
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
			],
		}).compile();
		storage = module.get(TemporaryFileStorage);
		s3clientAdapter = module.get(S3ClientAdapter);
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
		const file1 = new TemporaryFile(filename1, user1.id, tomorrow, new Date(), fileContent(user1.id, filename1).length);

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
		const file2 = new TemporaryFile(filename2, user2.id, tomorrow, new Date(), fileContent(user2.id, filename2).length);

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

	describe('sanitizeFilename is called', () => {
		describe('WHEN filename is valid', () => {
			it('should return same filename', () => {
				const filename = 'abc/def-ghi_jkl.txt';
				if (storage.sanitizeFilename) {
					expect(storage.sanitizeFilename(filename)).toBe(filename);
				}
			});
		});
		describe('WHEN filename contains invalid characters', () => {
			it('should sanitize %', () => {
				if (storage.sanitizeFilename) {
					expect(storage.sanitizeFilename('abc%/%def%.txt')).not.toContain('%');
				}
			});
			it('should sanitize µ', () => {
				if (storage.sanitizeFilename) {
					expect(storage.sanitizeFilename('gedµfwa/abc.txt')).not.toContain('µ');
				}
			});
			it('should crash if filename contains ..', () => {
				expect(() => {
					if (storage.sanitizeFilename) {
						return storage.sanitizeFilename('../etc/shadow');
					}
					return null;
				}).toThrow();
			});
		});
		describe('WHEN filename is empty', () => {
			it('should crash', () => {
				expect(() => {
					if (storage.sanitizeFilename) {
						storage.sanitizeFilename('');
					}
				}).toThrow();
			});
		});
	});

	describe('deleteFile is called', () => {
		describe('WHEN file exists', () => {
			it('should delete file', async () => {
				const { user1, file1 } = setup();
				repo.findByPath.mockResolvedValueOnce(file1);

				await storage.deleteFile(file1.filename, user1.id);

				expect(repo.delete).toHaveBeenCalled();
				expect(s3clientAdapter.delete).toHaveBeenCalledWith([join(user1.id, file1.filename)]);
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
				repo.findByPath.mockResolvedValue(file1);
				const result = await storage.fileExists(file1.filename, user1);
				expect(result).toBe(true);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { user1 } = setup();
				await expect(storage.fileExists('abc/nonexistingfile.txt', user1)).resolves.toBe(false);
			});
		});
	});

	describe('getFileStats is called', () => {
		describe('WHEN file exists', () => {
			it('should return file stats', async () => {
				const { user1, file1 } = setup();
				repo.findByUserAndFilename.mockResolvedValue(file1);
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
				await expect(async () => storage.getFileStats('abc/nonexistingfile.txt', user1)).rejects.toThrow();
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
				};
				repo.findByUserAndFilename.mockResolvedValue(file1);
				s3clientAdapter.get.mockResolvedValue(response);
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
				await expect(async () => storage.getFileStream('abc/nonexistingfile.txt', user1)).rejects.toThrow();
			});
		});
	});

	describe('listFiles is called', () => {
		describe('WHEN existing user is given', () => {
			it('should return only users file', async () => {
				const { user1, file1 } = setup();
				repo.findByUser.mockResolvedValue([file1]);
				const files = await storage.listFiles(user1);
				expect(files.length).toBe(1);
				expect(files[0].ownedByUserId).toBe(user1.id);
				expect(files[0].filename).toBe(file1.filename);
			});
		});
		describe('WHEN no user is given', () => {
			it('should return both users files', async () => {
				const { user1, user2, file1, file2 } = setup();
				repo.findExpired.mockResolvedValue([file1, file2]);
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
				repo.findByUserAndFilename.mockResolvedValue(file1);
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
				await expect(async () =>
					storage.saveFile(file1.filename, readStream, user1, new Date(2023, 0, 1))
				).rejects.toThrow();
			});
		});
	});
});

import { ReadStream, closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { IUser } from '@lumieducation/h5p-server';
import { Readable } from 'node:stream';
import { TemporaryFileStorage } from './temporary-file-storage';
import { TemporaryFile } from './temporary-file';

const testContent = 'This is fake H5P content.';
const today = new Date();
const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

describe('TemporaryFileStorage', () => {
	let module: TestingModule;
	let service: TemporaryFileStorage;
	const path = '/tmp/test_temp_file_storage';

	beforeAll(async () => {
		if (existsSync(path)) {
			rmSync(path, { recursive: true });
		}
		mkdirSync(path);
		module = await Test.createTestingModule({
			providers: [
				{
					provide: TemporaryFileStorage,
					useValue: new TemporaryFileStorage(path),
				},
			],
		}).compile();
		service = module.get(TemporaryFileStorage);
	});

	afterAll(async () => {
		await module.close();
		rmSync(path, { recursive: true });
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const createDummyFile = (filename: string, userId: string) => {
		const filepath = join(path, userId, filename);
		const dir = dirname(filepath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}

		const file = openSync(filepath, 'w');
		writeSync(file, Buffer.from(testContent));
		closeSync(file);

		const fileMeta = openSync(`${filepath}.meta`, 'w');
		const meta = new TemporaryFile(filename, userId, tomorrow);
		writeSync(fileMeta, Buffer.from(JSON.stringify(meta)));
		closeSync(fileMeta);
	};

	const setup = () => {
		const user: Required<IUser> = {
			email: 'testuser@example.org',
			id: '12342-43212',
			name: 'Marla Mathe',
			type: 'local',
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
		};
		const filename = 'abc/def.txt';
		const filepath = join(path, user.id, filename);
		const otherUserId = '32142-32143';
		createDummyFile(filename, user.id);
		createDummyFile(filename, otherUserId);
		return {
			user,
			otherUserId,
			filename,
			filepath,
		};
	};

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('sanitizeFilename is called', () => {
		describe('WHEN filename is valid', () => {
			it('should return same filename', () => {
				const filename = 'abc/def-ghi_jkl.txt';
				if (service.sanitizeFilename) {
					expect(service.sanitizeFilename(filename)).toBe(filename);
				}
			});
		});
		describe('WHEN filename contains invalid characters', () => {
			it('should sanitize %', () => {
				if (service.sanitizeFilename) {
					expect(service.sanitizeFilename('abc%/%def%.txt')).not.toContain('%');
				}
			});
			it('should sanitize µ', () => {
				if (service.sanitizeFilename) {
					expect(service.sanitizeFilename('gedµfwa/abc.txt')).not.toContain('µ');
				}
			});
			it('should crash if filename contains ..', () => {
				expect(() => {
					if (service.sanitizeFilename) {
						return service.sanitizeFilename('../etc/shadow');
					}
					return null;
				}).toThrow();
			});
		});
		describe('WHEN filename is empty', () => {
			it('should crash', () => {
				expect(() => {
					if (service.sanitizeFilename) {
						service.sanitizeFilename('');
					}
				}).toThrow();
			});
		});
	});

	describe('deleteFile is called', () => {
		describe('WHEN file exists', () => {
			it('should delete file', async () => {
				const { user, filename, filepath } = setup();
				await service.deleteFile(filename, user.id);
				const fileExists = existsSync(filepath);
				expect(fileExists).toBe(false);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user } = setup();
				await expect(async () => {
					await service.deleteFile('abc/nonexistingfile.txt', user.id);
				}).rejects.toThrow();
			});
		});
	});

	describe('fileExists is called', () => {
		describe('WHEN file exists', () => {
			it('should return true', async () => {
				const { user, filename } = setup();
				await expect(service.fileExists(filename, user)).resolves.toBe(true);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { user } = setup();
				await expect(service.fileExists('abc/nonexistingfile.txt', user)).resolves.toBe(false);
			});
		});
	});

	describe('getFileStats is called', () => {
		describe('WHEN file exists', () => {
			it('should return file stats', async () => {
				const { user, filename } = setup();
				const filestats = await service.getFileStats(filename, user);
				expect('size' in filestats && 'birthtime' in filestats).toBe(true);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user } = setup();
				await expect(async () => service.getFileStats('abc/nonexistingfile.txt', user)).rejects.toThrow();
			});
		});
	});

	describe('getFileStream is called', () => {
		describe('WHEN file exists and no range is given', () => {
			it('should return readable file stream', async () => {
				const { user, filename } = setup();
				const stream = await service.getFileStream(filename, user);
				let content = Buffer.alloc(0);
				await new Promise((resolve, reject) => {
					stream.on('data', (chunk) => {
						content += chunk;
					});
					stream.on('error', reject);
					stream.on('end', resolve);
				});
				expect(content).not.toBe(null);
				expect(content.toString()).toEqual(testContent);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should throw error', async () => {
				const { user } = setup();
				await expect(async () => service.getFileStream('abc/nonexistingfile.txt', user)).rejects.toThrow();
			});
		});
	});

	describe('listFiles is called', () => {
		describe('WHEN existing user is given', () => {
			it('should return only users file', async () => {
				const { user, filename } = setup();
				const files = await service.listFiles(user);
				expect(files.length).toBe(1);
				expect(files[0].ownedByUserId).toBe(user.id);
				expect(files[0].filename).toBe(filename);
			});
		});
		describe('WHEN no user is given', () => {
			it('should return both users files', async () => {
				const { user, otherUserId } = setup();
				const files = await service.listFiles();
				expect(files.length).toBe(2);
				expect(files[0].ownedByUserId).toBe(user.id);
				expect(files[1].ownedByUserId).toBe(otherUserId);
			});
		});
	});

	describe('saveFile is called', () => {
		describe('WHEN file exists', () => {
			it('should overwrite file', async () => {
				const { user, filename } = setup();
				const newData = 'This is new fake H5P content.';
				const readStream = Readable.from(newData);
				await service.saveFile(filename, readStream as ReadStream, user, tomorrow);
				const savedData = readFileSync(join(path, user.id, filename));
				expect(savedData.toString()).toBe(newData);
			});
		});
		describe('WHEN file does not exist', () => {
			it('should create new file', async () => {
				const { user } = setup();
				const filename = 'newfile.txt';
				const readStream = Readable.from(testContent);
				await service.saveFile(filename, readStream as ReadStream, user, tomorrow);
				const savedData = readFileSync(join(path, user.id, filename));
				expect(savedData.toString()).toBe(testContent);
			});
		});
		describe('WHEN expirationTime is in the past', () => {
			it('should throw error', async () => {
				const { user, filename } = setup();
				const readStream = Readable.from(testContent);
				await expect(async () =>
					service.saveFile(filename, readStream as ReadStream, user, new Date(2023, 0, 1))
				).rejects.toThrow();
			});
		});
	});
});

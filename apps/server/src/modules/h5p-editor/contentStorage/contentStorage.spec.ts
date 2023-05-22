import { Test, TestingModule } from '@nestjs/testing';
import { IContentMetadata, ILibraryName, IUser } from '@lumieducation/h5p-server';
import * as fs from 'node:fs';
import { Readable, Stream } from 'stream';
import rimraf from 'rimraf';
import path from 'node:path';
import { ContentStorage } from './contentStorage';

function delay(ms: number) {
	// eslint-disable-next-line no-promise-executor-return
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const setup = () => {
	const dir = './apps/server/src/modules/h5p-editor/contentStorage/testContentStorage/';

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	const library: ILibraryName = {
		machineName: 'testLibrary',
		majorVersion: 1,
		minorVersion: 0,
	};

	const metadata: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary',
		preloadedDependencies: [library],
		defaultLanguage: '',
		license: '',
		title: 'Test123',
	};

	const metadata2: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary2',
		preloadedDependencies: [library],
		defaultLanguage: '',
		license: '',
		title: 'Test123',
	};

	const testContentFilename = 'testContent.json';
	fs.writeFileSync(path.join(dir, testContentFilename), JSON.stringify(metadata));
	const content = testContentFilename;
	const user: IUser = {
		canCreateRestricted: false,
		canInstallRecommended: false,
		canUpdateAndInstallLibraries: false,
		email: 'testUser1@testUser123.de',
		id: '',
		name: 'User Test',
		type: '',
	};
	const stream: Stream = new Stream();

	const contentId = '2345';
	const contentId2 = '6789';
	const notExistingContentId = '987mn';
	fs.mkdirSync(path.join(dir, contentId.toString()), { recursive: true });
	fs.writeFileSync(path.join(dir, contentId.toString(), 'h5p.json'), JSON.stringify(metadata));
	fs.writeFileSync(path.join(dir, contentId.toString(), 'content.json'), JSON.stringify(content));

	fs.mkdirSync(path.join(dir, contentId2), { recursive: true });
	fs.writeFileSync(path.join(dir, contentId2.toString(), 'h5p.json'), JSON.stringify(metadata2));
	fs.writeFileSync(path.join(dir, contentId2.toString(), 'content.json'), JSON.stringify(content));

	const filename1 = 'testFile1.json';
	const notExistingFilename = 'testFile987.json';
	const undefinedContentId = '';
	fs.writeFileSync(path.join(dir, contentId.toString(), filename1), JSON.stringify(content));

	return {
		metadata,
		content,
		user,
		dir,
		stream,
		contentId,
		contentId2,
		notExistingContentId,
		filename1,
		notExistingFilename,
		library,
		undefinedContentId,
	};
};

describe('ContentStorage', () => {
	let module: TestingModule;
	let service: ContentStorage;
	const { dir } = setup();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ContentStorage,
					useValue: new ContentStorage(dir, { invalidCharactersRegexp: /!/ }),
				},
			],
		}).compile();
		service = module.get(ContentStorage);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		rimraf.sync(dir);
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('addContent', () => {
		describe('WHEN content is created successfully', () => {
			it('should return contentId', async () => {
				const { metadata, content, user } = setup();
				const contentID = await service.addContent(metadata, content, user);
				expect(contentID).toBeDefined();
				expect(typeof contentID).toBe('string');
			});
		});
		// TODO: Error case
	});

	describe('addFile', () => {
		describe('WHEN file is created successfully', () => {
			it('should add a file to content', async () => {
				const { stream, contentId } = setup();
				const filename = 'testFiletoAdd123.json';
				await service.addFile(contentId, filename, stream);
				await delay(0);
				const fileExists = fs.existsSync(path.join(dir, contentId.toString(), filename));
				expect(fileExists).toEqual(true);
			});
		});
		describe('WHEN file is not created successfully', () => {
			it('should throw an error', async () => {
				const { stream, notExistingContentId } = setup();
				const filename = 'testFiletoAdd123.json';
				try {
					await service.addFile(notExistingContentId, filename, stream);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('contentExists', () => {
		describe('WHEN content exists', () => {
			it('should return true', async () => {
				const { contentId } = setup();
				const contentExists = await service.contentExists(contentId);
				expect(contentExists).toEqual(true);
			});
		});
		describe('WHEN content does not exist', () => {
			it('should return false', async () => {
				const { notExistingContentId } = setup();
				const contentExists = await service.contentExists(notExistingContentId);
				expect(contentExists).toEqual(false);
			});
		});
		describe('WHEN content is undefined', () => {
			it('should throw an error', async () => {
				const { undefinedContentId } = setup();
				try {
					await service.contentExists(undefinedContentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('deleteContent', () => {
		describe('WHEN content is deleted successfully', () => {
			it('should delete existing content', async () => {
				const { contentId } = setup();
				await service.deleteContent(contentId);
				const contentExists = fs.existsSync(path.join(dir, contentId.toString()));
				expect(contentExists).toEqual(false);
			});
		});

		describe('WHEN content can not be deleted', () => {
			it('should throw error', async () => {
				const { notExistingContentId } = setup();
				try {
					await service.deleteContent(notExistingContentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});
	describe('deleteFile', () => {
		describe('WHEN file is deleted successfully', () => {
			it('should delete existing file', async () => {
				const { contentId, filename1 } = setup();
				await service.deleteFile(contentId, filename1);
				const fileExists = fs.existsSync(path.join(dir, contentId.toString(), filename1));
				expect(fileExists).toEqual(false);
			});
		});

		describe('WHEN file can not be deleted', () => {
			it('should throw error', async () => {
				const { notExistingContentId, notExistingFilename } = setup();
				try {
					await service.deleteFile(notExistingContentId, notExistingFilename);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});
	describe('fileExists', () => {
		describe('WHEN file exists', () => {
			it('should return true', async () => {
				const { contentId, filename1 } = setup();
				// const contentId = '901901';
				const fileExists = await service.fileExists(contentId, filename1);
				expect(fileExists).toEqual(true);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { notExistingContentId, notExistingFilename } = setup();
				const fileExists = await service.fileExists(notExistingContentId, notExistingFilename);
				expect(fileExists).toEqual(false);
			});
		});
		describe('WHEN conetntId is undefined', () => {
			it('should throw an error', async () => {
				const { undefinedContentId, notExistingFilename } = setup();
				try {
					await service.fileExists(undefinedContentId, notExistingFilename);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('getFileStats', () => {
		describe('WHEN file exists', () => {
			it('should return fileStats', async () => {
				const { contentId, filename1, user } = setup();
				const fileStats = await service.getFileStats(contentId, filename1, user);
				expect(fileStats).toBeDefined();
				expect(typeof fileStats).toBe('object');
				expect(fileStats.size).toBeGreaterThan(0);
				expect(fileStats.birthtime).toBeDefined();
			});
		});

		describe('WHEN file does not exist', () => {
			it('should throw an error', async () => {
				const { notExistingContentId, notExistingFilename, user } = setup();
				try {
					await service.getFileStats(notExistingContentId, notExistingFilename, user);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('getFileStream', () => {
		describe('WHEN file exists', () => {
			it('should return fileStream', async () => {
				const { contentId, filename1, user } = setup();
				const fileStream = await service.getFileStream(contentId, filename1, user);
				expect(fileStream).toBeDefined();
				expect(typeof fileStream).toBe('object');
				expect(fileStream).toBeInstanceOf(Readable);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should throw an error', async () => {
				const { notExistingContentId, notExistingFilename, user } = setup();
				try {
					await service.getFileStream(notExistingContentId, notExistingFilename, user);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('getMetadata', () => {
		describe('WHEN file exists', () => {
			it('should return metadata', async () => {
				const { contentId, user } = setup();
				const metadata = await service.getMetadata(contentId, user);
				expect(metadata).toBeDefined();
				expect(metadata.language).toEqual('de');
			});
		});

		describe('WHEN user is not defined', () => {
			it('should throw an error', async () => {
				const { contentId } = setup();
				try {
					await service.getMetadata(contentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('getParameters', () => {
		describe('WHEN user and content is defined', () => {
			it('should return parameters', async () => {
				const { contentId, user } = setup();
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const parameters = await service.getParameters(contentId, user);
				expect(parameters).toBeDefined();
				expect(typeof parameters).toBe('string');
			});
		});

		describe('WHEN user is not defined', () => {
			it('should throw an error', async () => {
				const { contentId } = setup();
				try {
					await service.getParameters(contentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('getUsage', () => {
		describe('WHEN file exists and has main library', () => {
			it('should return usage with main library greater than 0', async () => {
				const { library } = setup();
				const usage = await service.getUsage(library);
				expect(usage).toBeDefined();
				expect(usage.asMainLibrary).toBeGreaterThan(0);
				expect(usage.asDependency).toBeGreaterThan(0);
			});
		});
	});

	describe('getUserPermissions', () => {
		describe('WHEN user and content is defined', () => {
			it('should return parameters', async () => {
				const { contentId, user } = setup();
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const permissions = await service.getUserPermissions(contentId, user);
				expect(permissions).toBeDefined();
				expect(permissions.length).toBeGreaterThan(0);
				expect(permissions[1]).toEqual(1);
				expect(permissions[2]).toEqual(2);
				expect(permissions[3]).toEqual(3);
				expect(permissions[4]).toEqual(5);
			});
		});
	});

	describe('listFiles', () => {
		describe('WHEN content has files', () => {
			it('should return a list of files from the content', async () => {
				const { contentId, user } = setup();
				const fileList = await service.listFiles(contentId, user);
				expect(fileList).toBeDefined();
				expect(fileList.length).toBeGreaterThan(0);
				expect(fileList[0]).toEqual('testFile1.json');
			});
		});
	});
});

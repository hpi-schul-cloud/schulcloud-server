import { Test, TestingModule } from '@nestjs/testing';
import { IContentMetadata, ILibraryName, IUser } from '@lumieducation/h5p-server';
import fsPromiseMock from 'node:fs/promises';
import { Readable, Stream } from 'stream';
import rimraf from 'rimraf';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { IGetFileResponse } from '@src/modules/files-storage/interface';
import { ContentStorage } from './contentStorage';

const setup = () => {
	const dir = './apps/server/src/modules/h5p-editor/contentStorage/testContentStorage/';

	const library: ILibraryName = {
		machineName: 'testLibrary',
		majorVersion: 1,
		minorVersion: 0,
	};

	const library2: ILibraryName = {
		machineName: 'testLibrary56',
		majorVersion: 1,
		minorVersion: 0,
	};

	const metadata: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary',
		preloadedDependencies: [library],
		editorDependencies: [library],
		dynamicDependencies: [library],
		defaultLanguage: 'de',
		license: '123license',
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

	const metadata3: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary3',
		preloadedDependencies: [],
		editorDependencies: [],
		dynamicDependencies: [],
		defaultLanguage: '',
		license: '',
		title: 'Test123',
	};

	const readableStream = new Stream.Readable({ objectMode: true });
	readableStream._read = function test() {};
	readableStream.push(JSON.stringify(metadata));
	/*
	if (metadata.contentType !== undefined) {
		stream3.push({ x: metadata.contentType.toString() });
	}
	*/

	const fileResponse: IGetFileResponse = {
		data: readableStream,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const fileList = ['123.json', 'test.png'];
	const readableListStream = new Stream.Readable({ objectMode: true });
	readableListStream._read = function test() {};
	readableListStream.push(JSON.stringify(fileList));
	const fileListResponse: IGetFileResponse = {
		data: readableListStream,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const testContentFilename = 'testContent.json';
	// fs.writeFileSync(path.join(dir, testContentFilename), JSON.stringify(metadata));
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
	// const contentId4 = '5678906';
	const notExistingContentId = '987mn';
	/*
	fs.mkdirSync(path.join(dir, contentId.toString()), { recursive: true });
	fs.writeFileSync(path.join(dir, contentId.toString(), 'h5p.json'), JSON.stringify(metadata));
	fs.writeFileSync(path.join(dir, contentId.toString(), 'content.json'), JSON.stringify(content));

	fs.mkdirSync(path.join(dir, contentId2), { recursive: true });
	fs.writeFileSync(path.join(dir, contentId2.toString(), 'h5p.json'), JSON.stringify(metadata2));
	fs.writeFileSync(path.join(dir, contentId2.toString(), 'content.json'), JSON.stringify(content));

	fs.mkdirSync(path.join(dir, contentId4), { recursive: true });
	fs.writeFileSync(path.join(dir, contentId4.toString(), 'h5p.json'), JSON.stringify(metadata3));
	fs.writeFileSync(path.join(dir, contentId4.toString(), 'content.json'), JSON.stringify(content));
	*/

	const filename1 = 'testFile1.json';
	const notExistingFilename = 'testFile987.json';
	const undefinedContentId = '';
	const wrongFilename = 'testName!?.json';
	const filename2 = 'testFiletoAdd123.json';
	const emptyContentId = '';
	// fs.writeFileSync(path.join(dir, contentId.toString(), filename1), JSON.stringify(content));

	return {
		content,
		contentId,
		contentId2,
		dir,
		emptyContentId,
		filename1,
		filename2,
		fileResponse,
		fileListResponse,
		fileList,
		library,
		library2,
		metadata,
		notExistingContentId,
		notExistingFilename,
		stream,
		undefinedContentId,
		user,
		wrongFilename,
	};
};

describe('ContentStorage', () => {
	let module: TestingModule;
	let service: ContentStorage;
	const { dir } = setup();
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentStorage,
				{
					provide: S3ClientAdapter,
					useValue: createMock<S3ClientAdapter>(),
				},
			],
		}).compile();
		service = module.get(ContentStorage);
		s3ClientAdapter = module.get(S3ClientAdapter);
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
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
				const contentID = await service.addContent(metadata, content, user);
				expect(contentID).toBeDefined();
				expect(typeof contentID).toBe('string');
			});
		});
		describe('WHEN contentId is empty', () => {
			it('should throw new error', async () => {
				const { metadata, content, user, emptyContentId } = setup();
				try {
					await service.addContent(metadata, content, user, emptyContentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
		describe('WHEN content can not be added error', () => {
			it('should throw new error', async () => {
				const { metadata, content, user } = setup();
				jest.spyOn(fsPromiseMock, 'writeFile').mockImplementationOnce(() => {
					throw new Error('Could not write file');
				});
				try {
					await service.addContent(metadata, content, user);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
		describe('WHEN contentId can not be generated', () => {
			it('should throw new error', async () => {
				const { metadata, content, user } = setup();
				// eslint-disable-next-line @typescript-eslint/require-await
				jest.spyOn(fsPromiseMock, 'access').mockImplementation(async () => undefined);
				try {
					await service.addContent(metadata, content, user);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
	});

	describe('addFile', () => {
		describe('WHEN file is created successfully', () => {
			it('should add a file to content', async () => {
				const { stream, contentId } = setup();
				const filename = 'testFiletoAdd123.json';
				expect(await service.addFile(contentId, filename, stream)).not.toBeInstanceOf(Error);
			});
		});
		describe('WHEN file is not created successfully', () => {
			it('should throw an error', async () => {
				const { stream, notExistingContentId, filename2 } = setup();
				try {
					await service.addFile(notExistingContentId, filename2, stream);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
		describe('WHEN filename has special characters', () => {
			it('should throw an error', async () => {
				const { stream, notExistingContentId, wrongFilename } = setup();
				try {
					await service.addFile(notExistingContentId, wrongFilename, stream);
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
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
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
				expect(await service.deleteContent(contentId)).not.toBeInstanceOf(Error);
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
				expect(await service.deleteFile(contentId, filename1)).not.toBeInstanceOf(Error);
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
				const fileExists = await service.fileExists(contentId, filename1);
				expect(fileExists).toEqual(true);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { notExistingContentId, notExistingFilename } = setup();
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
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
				const { contentId, filename1, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
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
				const { contentId, filename1, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
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
				const { contentId, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
				const metadata = await service.getMetadata(contentId, user);
				expect(metadata).toBeDefined();
				// expect(metadata.language).toEqual('de');
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
				const { contentId, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const parameters = await service.getParameters(contentId, user);
				expect(parameters).toBeDefined();
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
			it('should return usage with main library equal to 0', async () => {
				const { library } = setup();
				const usage = await service.getUsage(library);
				expect(usage).toBeDefined();
				expect(usage.asMainLibrary).toEqual(0);
				expect(usage.asDependency).toEqual(0);
			});
		});
		describe('WHEN file exists and does not have a library', () => {
			it('should return 0 dependecies and libaries', async () => {
				const { library2 } = setup();
				const usage = await service.getUsage(library2);
				expect(usage).toBeDefined();
				expect(usage.asMainLibrary).toEqual(0);
				expect(usage.asDependency).toEqual(0);
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
				const { contentId, user, fileListResponse, fileList } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileListResponse);
				const contentFileList = await service.listFiles(contentId, user);
				expect(contentFileList).toBeDefined();
				expect(contentFileList.length).toBe(2);
				expect(contentFileList[0]).toEqual(fileList[0]);
				expect(contentFileList[1]).toEqual(fileList[1]);
			});
		});
	});
});

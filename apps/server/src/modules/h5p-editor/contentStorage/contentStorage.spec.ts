import { Test, TestingModule } from '@nestjs/testing';
import { IContentMetadata, ILibraryName, IUser } from '@lumieducation/h5p-server';
import { Readable, Stream } from 'stream';
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

	const metadata4Editor: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary',
		preloadedDependencies: [],
		editorDependencies: [library],
		dynamicDependencies: [],
		defaultLanguage: 'de',
		license: '123license',
		title: 'Test123',
	};

	const metadata5Dynamic: IContentMetadata = {
		embedTypes: ['div'],
		language: 'de',
		mainLibrary: 'testLibrary',
		preloadedDependencies: [],
		editorDependencies: [],
		dynamicDependencies: [library],
		defaultLanguage: 'de',
		license: '123license',
		title: 'Test123',
	};

	const readableStream = new Stream.Readable({ objectMode: true });
	readableStream._read = function test() {};
	readableStream.push(JSON.stringify(metadata));

	const fileResponse: IGetFileResponse = {
		data: readableStream,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const readableStream2 = new Stream.Readable({ objectMode: true });
	readableStream2._read = function test() {};
	readableStream2.push(JSON.stringify(metadata2));

	const fileResponse2: IGetFileResponse = {
		data: readableStream2,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const readableStream3 = new Stream.Readable({ objectMode: true });
	readableStream3._read = function test() {};
	readableStream3.push(JSON.stringify(metadata3));

	const fileResponse3: IGetFileResponse = {
		data: readableStream3,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const readableStream4 = new Stream.Readable({ objectMode: true });
	readableStream4._read = function test() {};
	readableStream4.push(JSON.stringify(metadata4Editor));

	const fileResponse4: IGetFileResponse = {
		data: readableStream4,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const readableStream5 = new Stream.Readable({ objectMode: true });
	readableStream5._read = function test() {};
	readableStream5.push(JSON.stringify(metadata5Dynamic));

	const fileResponse5: IGetFileResponse = {
		data: readableStream5,
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

	const fileList2 = ['123.json'];
	const readableListStream2 = new Stream.Readable({ objectMode: true });
	readableListStream2._read = function test() {};
	readableListStream2.push(JSON.stringify(fileList2));
	const fileListResponse2: IGetFileResponse = {
		data: readableListStream2,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const contentIdList = ['123456', '0987656'];
	const readableIdStream = new Stream.Readable({ objectMode: true });
	readableIdStream._read = function test() {};
	readableIdStream.push(JSON.stringify(contentIdList));
	const contentIdListResponse: IGetFileResponse = {
		data: readableIdStream,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const contentIdList2 = ['123456'];
	const readableIdStream2 = new Stream.Readable({ objectMode: true });
	readableIdStream2._read = function test() {};
	readableIdStream2.push(JSON.stringify(contentIdList2));
	const contentIdListResponse2: IGetFileResponse = {
		data: readableIdStream2,
		contentType: 'json',
		contentLength: 123,
		contentRange: '768934898',
		etag: 'etag',
	};

	const testContentFilename = 'testContent.json';
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

	const filename1 = 'testFile1.json';
	const notExistingFilename = 'testFile987.json';
	const undefinedContentId = '';
	const wrongFilename = 'testName!?.json';
	const filename2 = 'testFiletoAdd123.json';
	const emptyContentId = '';

	const h5pPath = '/h5p/123453/1345245676/h5p.json';
	const contentPath = '/h5p/123453/1345245676/content.json';

	return {
		content,
		contentId,
		contentId2,
		contentIdList,
		contentIdListResponse,
		contentIdListResponse2,
		contentPath,
		dir,
		emptyContentId,
		filename1,
		filename2,
		fileResponse,
		fileResponse2,
		fileResponse3,
		fileResponse4,
		fileResponse5,
		fileListResponse,
		fileListResponse2,
		fileList,
		h5pPath,
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
				const { metadata, content, user, contentId } = setup();
				s3ClientAdapter.create.mockImplementationOnce(() => {
					throw new Error('Could not write file');
				});
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
				try {
					await service.addContent(metadata, content, user, contentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
		describe('WHEN content already exists', () => {
			it('should throw new error', async () => {
				const { metadata, content, user, contentId } = setup();
				s3ClientAdapter.get.mockRejectedValue(new Error('FoundTooMany'));
				try {
					await service.addContent(metadata, content, user, contentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});
		describe('WHEN contentId can not be generated', () => {
			it('should throw new error', async () => {
				const { metadata, content, user, fileResponse } = setup();
				// eslint-disable-next-line @typescript-eslint/require-await
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
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
		describe('WHEN content is missing', () => {
			it('should throw an error', async () => {
				const { stream, notExistingContentId, filename2 } = setup();
				try {
					s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
					await service.addFile(notExistingContentId, filename2, stream);
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
			it('should delete existing fileList', async () => {
				const { contentId, fileListResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileListResponse);
				expect(await service.deleteContent(contentId)).not.toBeInstanceOf(Error);
			});
		});

		describe('WHEN content can not be deleted', () => {
			it('should throw error', async () => {
				const { notExistingContentId } = setup();
				try {
					s3ClientAdapter.delete.mockRejectedValue(new NotFoundException('Failed to delete content.'));
					await service.deleteContent(notExistingContentId);
				} catch (err) {
					expect(err).toBeInstanceOf(Error);
				}
			});
		});

		describe('WHEN content is missing', () => {
			it('should throw an error', async () => {
				const { notExistingContentId } = setup();
				try {
					s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
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
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
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
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NotFound'));
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
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NotFound'));
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
	describe('resolveDependecies', () => {
		describe('WHEN file exists and has main library', () => {
			it('should return main library from preloadedDependencies equal to 2', async () => {
				const { library, contentIdList, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
				// s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				const result = await service.resolveDependecies(contentIdList, user, library);
				expect(result).toBeDefined();
				expect(result.asMainLibrary).toEqual(2);
				expect(result.asDependency).toEqual(0);
			});
			it('should return main library from editorDependencies equal to 2', async () => {
				const { library, contentIdList, user, fileResponse4 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse4);
				// s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				const result = await service.resolveDependecies(contentIdList, user, library);
				expect(result).toBeDefined();
				expect(result.asMainLibrary).toEqual(2);
				expect(result.asDependency).toEqual(0);
			});
			it('should return main library from dynamicDependencies equal to 2', async () => {
				const { library, contentIdList, user, fileResponse5 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse5);
				// s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				const result = await service.resolveDependecies(contentIdList, user, library);
				expect(result).toBeDefined();
				expect(result.asMainLibrary).toEqual(2);
				expect(result.asDependency).toEqual(0);
			});
		});
		describe('WHEN file exists and has dependency', () => {
			it('should return dependencies equal to 2', async () => {
				const { library, contentIdList, user, fileResponse2 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse2);
				// s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				const result = await service.resolveDependecies(contentIdList, user, library);
				expect(result).toBeDefined();
				expect(result.asMainLibrary).toEqual(0);
				expect(result.asDependency).toEqual(2);
			});
		});
		describe('WHEN file exists and has no main library and dependecies', () => {
			it('should return main library and dependencies equal to 0', async () => {
				const { library, contentIdList, user, fileResponse3 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse3);
				// s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				const result = await service.resolveDependecies(contentIdList, user, library);
				expect(result).toBeDefined();
				expect(result.asMainLibrary).toEqual(0);
				expect(result.asDependency).toEqual(0);
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

	describe('updateContentIdList', () => {
		describe('WHEN adding contentId', () => {
			it('should not throw an error', () => {
				const { contentId, contentIdListResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(contentIdListResponse);
				expect(() => service.updateContentIdList(contentId, 'add')).not.toThrow(Error);
				// expect(await service.updateContentIdList(contentId, 'add')).not.toEqual(new Error());
			});
		});

		describe('WHEN deleteing contentId', () => {
			it('should not throw an error', () => {
				const { contentId, contentIdListResponse2 } = setup();
				s3ClientAdapter.get.mockResolvedValue(contentIdListResponse2);
				expect(() => service.updateContentIdList(contentId, 'delete')).not.toThrow(Error);
				// expect(await service.updateContentIdList(contentId, 'delete')).not.toEqual(new Error());
			});
		});
	});

	describe('updateFileList', () => {
		describe('WHEN adding filenames', () => {
			it('should not throw an error', async () => {
				const { contentId, fileListResponse, filename1 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileListResponse);
				expect(await service.updateFileList(contentId, filename1, 'add')).not.toEqual(new Error());
			});
		});

		describe('WHEN deleteing filenames', () => {
			it('should not throw an error', async () => {
				const { contentId, fileListResponse2, filename1 } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileListResponse2);
				expect(await service.updateFileList(contentId, filename1, 'delete')).not.toEqual(new Error());
			});
		});
	});

	describe('deleteCreatedFiles', () => {
		describe('WHEN h5p and content already exists', () => {
			it('should not throw an error', async () => {
				const { h5pPath, contentPath, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValue(fileResponse);
				expect(await service.deleteCreatedFiles(h5pPath, contentPath)).not.toEqual(new Error());
			});
		});
		describe('WHEN content and h5p does not exist', () => {
			it('should not throw an error', async () => {
				const { h5pPath, contentPath } = setup();
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));
				expect(await service.deleteCreatedFiles(h5pPath, contentPath)).not.toEqual(new Error());
			});
		});
	});
});

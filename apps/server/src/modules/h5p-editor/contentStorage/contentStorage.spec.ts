import { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { IContentMetadata, ILibraryName, LibraryName } from '@lumieducation/h5p-server';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IEntity } from '@shared/domain';
import { S3ClientAdapter } from '@src/modules/files-storage/client/s3-client.adapter';
import { IGetFileResponse } from '@src/modules/files-storage/interface';
import { ObjectID } from 'bson';
import { Readable } from 'stream';
import { ContentStorage } from './contentStorage';
import { H5PContent } from './h5p-content.entity';
import { H5PContentRepo } from './h5p-content.repo';

const helpers = {
	buildMetadata(
		title: string,
		mainLibrary: string,
		preloadedDependencies: ILibraryName[] = [],
		dynamicDependencies?: ILibraryName[],
		editorDependencies?: ILibraryName[]
	): IContentMetadata {
		return {
			defaultLanguage: 'de-DE',
			license: 'Unlicensed',
			title,
			dynamicDependencies,
			editorDependencies,
			embedTypes: ['iframe'],
			language: 'de-DE',
			mainLibrary,
			preloadedDependencies,
		};
	},

	buildContent(n = 0) {
		const metadata = helpers.buildMetadata(`Content #${n}`, `Library-${n}.0`);
		const content = {
			data: `Data #${n}`,
		};

		const h5pContent = new H5PContent({ metadata, content });

		return {
			withID(id?: number) {
				const objectId = new ObjectID(id);
				h5pContent._id = objectId;
				h5pContent.id = objectId.toString();

				return h5pContent;
			},
			new() {
				return h5pContent;
			},
		};
	},

	createUser() {
		return {
			canCreateRestricted: false,
			canInstallRecommended: false,
			canUpdateAndInstallLibraries: false,
			email: 'example@schul-cloud.org',
			id: '12345',
			name: 'Example User',
			type: 'user',
		};
	},

	repoSaveMock: async <Entity extends IEntity>(entities: Entity | Entity[]) => {
		if (!Array.isArray(entities)) {
			entities = [entities];
		}

		for (const entity of entities) {
			if (!entity._id) {
				const id = new ObjectID();
				entity._id = id;
				entity.id = id.toString();
			}
		}

		return Promise.resolve();
	},
};

describe('ContentStorage', () => {
	let module: TestingModule;
	let service: ContentStorage;
	let s3ClientAdapter: DeepMocked<S3ClientAdapter>;
	let contentRepo: DeepMocked<H5PContentRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ContentStorage,
				{ provide: S3ClientAdapter, useValue: createMock<S3ClientAdapter>() },
				{ provide: H5PContentRepo, useValue: createMock<H5PContentRepo>() },
			],
		}).compile();

		service = module.get(ContentStorage);
		s3ClientAdapter = module.get(S3ClientAdapter);
		contentRepo = module.get(H5PContentRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('service should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('addContent', () => {
		const setup = () => {
			const newContent = helpers.buildContent(0).new();
			const existingContent = helpers.buildContent(0).withID();

			const user = helpers.createUser();

			return { newContent, existingContent, user };
		};

		describe('WHEN adding new content', () => {
			it('should call H5pContentRepo.save', async () => {
				const {
					newContent: { metadata, content },
					user,
				} = setup();

				await service.addContent(metadata, content, user);

				expect(contentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ metadata, content }));
			});

			it('should return content id', async () => {
				const {
					newContent: { metadata, content },
					user,
				} = setup();
				contentRepo.save.mockImplementationOnce(helpers.repoSaveMock);

				const id = await service.addContent(metadata, content, user);

				expect(id).toBeDefined();
			});
		});

		describe('WHEN modifying existing content', () => {
			it('should call H5pContentRepo.findById', async () => {
				const {
					existingContent: { metadata, content, id },
					user,
				} = setup();

				await service.addContent(metadata, content, user, id);

				expect(contentRepo.findById).toHaveBeenCalledWith(id);
			});

			it('should call H5pContentRepo.save', async () => {
				const {
					existingContent,
					newContent: { metadata, content },
					user,
				} = setup();
				contentRepo.findById.mockResolvedValueOnce(existingContent);

				await service.addContent(metadata, content, user, existingContent.id);

				expect(contentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ metadata, content }));
			});

			it('should save content and return existing content id', async () => {
				const {
					existingContent,
					newContent: { metadata, content },
					user,
				} = setup();
				const oldId = existingContent.id;
				contentRepo.save.mockImplementationOnce(helpers.repoSaveMock);
				contentRepo.findById.mockResolvedValueOnce(existingContent);

				const newId = await service.addContent(metadata, content, user, oldId);

				expect(newId).toEqual(oldId);
				expect(existingContent).toEqual(expect.objectContaining({ metadata, content }));
			});
		});

		describe('WHEN saving content fails', () => {
			it('should throw an InternalServerErrorException', async () => {
				const {
					existingContent: { metadata, content },
					user,
				} = setup();
				contentRepo.save.mockRejectedValueOnce(new Error());

				const addContentPromise = service.addContent(metadata, content, user);

				await expect(addContentPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN finding content fails', () => {
			it('should throw an InternalServerErrorException', async () => {
				const {
					existingContent: { metadata, content, id },
					user,
				} = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const addContentPromise = service.addContent(metadata, content, user, id);

				await expect(addContentPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});
	});

	describe('addFile', () => {
		const setup = () => {
			const filename = 'filename.txt';
			const stream = Readable.from('content');

			const contentID = new ObjectID();
			const contentIDString = contentID.toString();

			const user = helpers.createUser();

			const fileCreateError = new Error('Could not create file');

			return {
				filename,
				stream,
				contentID,
				contentIDString,
				user,
				fileCreateError,
			};
		};

		describe('WHEN adding a file to existing content', () => {
			it('should check if the content exists', async () => {
				const { contentIDString, filename, stream, user } = setup();

				await service.addFile(contentIDString, filename, stream, user);

				expect(contentRepo.findById).toBeCalledWith(contentIDString);
			});

			it('should call S3ClientAdapter.create', async () => {
				const { contentIDString, filename, stream, user } = setup();

				await service.addFile(contentIDString, filename, stream, user);

				expect(s3ClientAdapter.create).toBeCalledWith(
					expect.stringContaining(filename),
					expect.objectContaining({
						name: filename,
						data: stream,
						mimeType: 'application/json',
					})
				);
			});
		});

		describe('WHEN adding a file to non existant content', () => {
			it('should throw NotFoundException', async () => {
				const { contentIDString, filename, stream, user } = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const addFilePromise = service.addFile(contentIDString, filename, stream, user);

				await expect(addFilePromise).rejects.toBeInstanceOf(NotFoundException);
			});
		});

		describe('WHEN S3ClientAdapter throws error', () => {
			it('should throw the error', async () => {
				const { contentIDString, filename, stream, user, fileCreateError } = setup();
				s3ClientAdapter.create.mockRejectedValueOnce(fileCreateError);

				const addFilePromise = service.addFile(contentIDString, filename, stream, user);

				await expect(addFilePromise).rejects.toBe(fileCreateError);
			});
		});

		describe('WHEN content id is empty string', () => {
			it('should throw error', async () => {
				const { filename, stream, user } = setup();

				const addFilePromise = service.addFile('', filename, stream, user);

				await expect(addFilePromise).rejects.toThrow();
			});
		});
	});

	describe('contentExists', () => {
		describe('WHEN content does exist', () => {
			it('should return true', async () => {
				const content = helpers.buildContent().withID();
				contentRepo.findById.mockResolvedValueOnce(content);

				const exists = await service.contentExists(content.id);

				expect(exists).toBe(true);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should return false', async () => {
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const exists = await service.contentExists('');

				expect(exists).toBe(false);
			});
		});
	});

	describe('deleteContent', () => {
		const setup = () => {
			const content = helpers.buildContent().withID();

			const files = ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt'];

			const user = helpers.createUser();

			return {
				content,
				files,
				user,
			};
		};

		describe('WHEN content exists', () => {
			it('should call H5PContentRepo.delete', async () => {
				const { content, user } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);

				await service.deleteContent(content.id, user);

				expect(contentRepo.delete).toHaveBeenCalledWith(content);
			});

			it('should call S3ClientAdapter.deleteFile for every file', async () => {
				const { content, user, files } = setup();
				s3ClientAdapter.list.mockResolvedValueOnce(files);

				await service.deleteContent(content.id, user);

				for (const file of files) {
					expect(s3ClientAdapter.delete).toHaveBeenCalledWith([expect.stringContaining(file)]);
				}
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw InternalServerErrorException', async () => {
				const { content, user } = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id, user);

				await expect(deletePromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN H5PContentRepo.delete throws an error', () => {
			it('should throw InternalServerErrorException', async () => {
				const { content, user } = setup();
				contentRepo.delete.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id, user);

				await expect(deletePromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN S3ClientAdapter.delete throws an error', () => {
			it('should throw InternalServerErrorException', async () => {
				const { content, user } = setup();
				s3ClientAdapter.delete.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id, user);

				await expect(deletePromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});
	});

	describe('deleteFile', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const user = helpers.createUser();

			const deleteError = new Error('Could not delete');

			const contentID = new ObjectID().toString();

			return {
				contentID,
				deleteError,
				filename,
				invalidFilename,
				user,
			};
		};

		describe('WHEN deleting a file', () => {
			it('should call S3ClientAdapter.delete', async () => {
				const { contentID, filename, user } = setup();

				await service.deleteFile(contentID, filename, user);

				expect(s3ClientAdapter.delete).toHaveBeenCalledWith([expect.stringContaining(contentID)]);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { contentID, invalidFilename, user } = setup();

				const deletePromise = service.deleteFile(contentID, invalidFilename, user);

				await expect(deletePromise).rejects.toThrow();
			});
		});

		describe('WHEN S3ClientAdapter throws an error', () => {
			it('should throw along the error', async () => {
				const { contentID, filename, user, deleteError } = setup();
				s3ClientAdapter.delete.mockRejectedValueOnce(deleteError);

				const deletePromise = service.deleteFile(contentID, filename, user);

				await expect(deletePromise).rejects.toBe(deleteError);
			});
		});
	});

	describe('fileExists', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const deleteError = new Error('Could not delete');

			const contentID = new ObjectID().toString();

			return {
				contentID,
				deleteError,
				filename,
				invalidFilename,
			};
		};

		describe('WHEN file exists', () => {
			it('should return true', async () => {
				const { contentID, filename } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(createMock());

				const exists = await service.fileExists(contentID, filename);

				expect(exists).toBe(true);
			});
		});

		describe('WHEN file does not exist', () => {
			it('should return false', async () => {
				const { contentID, filename } = setup();
				s3ClientAdapter.head.mockRejectedValueOnce(new Error('NoSuchKey'));

				const exists = await service.fileExists(contentID, filename);

				expect(exists).toBe(false);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw InternalServerException', async () => {
				const { contentID, filename } = setup();
				s3ClientAdapter.head.mockRejectedValueOnce(new Error());

				const existsPromise = service.fileExists(contentID, filename);

				await expect(existsPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { contentID, invalidFilename } = setup();

				const existsPromise = service.fileExists(contentID, invalidFilename);

				await expect(existsPromise).rejects.toThrow();
			});
		});
	});

	describe('getFileStats', () => {
		const setup = () => {
			const filename = 'file.txt';

			const user = helpers.createUser();

			const contentID = new ObjectID().toString();

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
				contentID,
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
				const { filename, contentID, user, headResponse, size, birthtime } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponse);

				const stats = await service.getFileStats(contentID, filename, user);

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
				const { filename, contentID, user, headResponseWithoutContentLength } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponseWithoutContentLength);

				const statsPromise = service.getFileStats(contentID, filename, user);

				await expect(statsPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN response from S3 is missing LastModified field', () => {
			it('should throw InternalServerError', async () => {
				const { filename, contentID, user, headResponseWithoutLastModified } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponseWithoutLastModified);

				const statsPromise = service.getFileStats(contentID, filename, user);

				await expect(statsPromise).rejects.toBeInstanceOf(InternalServerErrorException);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw the error', async () => {
				const { filename, contentID, user, headError } = setup();
				s3ClientAdapter.head.mockRejectedValueOnce(headError);

				const statsPromise = service.getFileStats(contentID, filename, user);

				await expect(statsPromise).rejects.toBe(headError);
			});
		});
	});

	describe('getFileStream', () => {
		const setup = () => {
			const filename = 'testfile.txt';
			const fileStream = Readable.from('content');
			const contentID = new ObjectID().toString();
			const fileResponse = createMock<IGetFileResponse>({ data: fileStream });
			const user = helpers.createUser();

			const getError = new Error('Could not get file');

			// [start, end, expected range]
			const testRanges = [
				[undefined, undefined, '0-'],
				[100, undefined, '100-'],
				[undefined, 100, '0-100'],
				[100, 999, '100-999'],
			] as const;

			return { filename, contentID, fileStream, fileResponse, testRanges, user, getError };
		};

		describe('WHEN file exists', () => {
			it('should S3ClientAdapter.get with range', async () => {
				const { testRanges, contentID, filename, user } = setup();

				for (const range of testRanges) {
					// eslint-disable-next-line no-await-in-loop
					await service.getFileStream(contentID, filename, user, range[0], range[1]);

					expect(s3ClientAdapter.get).toHaveBeenCalledWith(expect.stringContaining(filename), range[2]);
				}
			});

			it('should return stream from S3ClientAdapter', async () => {
				const { fileStream, contentID, filename, user, fileResponse } = setup();
				s3ClientAdapter.get.mockResolvedValueOnce(fileResponse);

				const stream = await service.getFileStream(contentID, filename, user);

				expect(stream).toBe(fileStream);
			});
		});

		describe('WHEN S3ClientAdapter.get throws error', () => {
			it('should throw the error', async () => {
				const { contentID, filename, user, getError } = setup();
				s3ClientAdapter.get.mockRejectedValueOnce(getError);

				const streamPromise = service.getFileStream(contentID, filename, user);

				await expect(streamPromise).rejects.toBe(getError);
			});
		});
	});

	describe('getMetadata', () => {
		const setup = () => {
			const content = helpers.buildContent().withID();
			const { id } = content;
			const error = new Error('Content not found');

			const user = helpers.createUser();

			return { content, id, user, error };
		};

		describe('WHEN content exists', () => {
			it('should return metadata', async () => {
				const { content, id } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);

				const metadata = await service.getMetadata(id);

				expect(metadata).toEqual(content.metadata);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw error', async () => {
				const { id, error } = setup();
				contentRepo.findById.mockRejectedValueOnce(error);

				const metadataPromise = service.getMetadata(id);

				await expect(metadataPromise).rejects.toBe(error);
			});
		});
	});

	describe('getParameters', () => {
		const setup = () => {
			const content = helpers.buildContent().withID();
			const { id } = content;
			const error = new Error('Content not found');

			const user = helpers.createUser();

			return { content, id, user, error };
		};

		describe('WHEN content exists', () => {
			it('should return parameters', async () => {
				const { content, id } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);

				const parameters = await service.getParameters(id);

				expect(parameters).toEqual(content.content);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw error', async () => {
				const { id, error } = setup();
				contentRepo.findById.mockRejectedValueOnce(error);

				const parametersPromise = service.getParameters(id);

				await expect(parametersPromise).rejects.toBe(error);
			});
		});
	});

	describe('listContent', () => {
		const setup = () => {
			const getContentsResponse = [1, 2, 3, 4].map((id) => helpers.buildContent().withID(id));
			const contentIds = getContentsResponse.map((content) => content.id);

			const error = new Error('could not list entities');

			const user = helpers.createUser();

			return { getContentsResponse, contentIds, user, error };
		};

		describe('WHEN querying for contents', () => {
			it('should return list of IDs', async () => {
				const { contentIds, getContentsResponse, user } = setup();
				contentRepo.getAllContents.mockResolvedValueOnce(getContentsResponse);

				const ids = await service.listContent(user);

				expect(ids).toEqual(contentIds);
			});
		});

		describe('WHEN H5PContentRepo.getAllContents throws error', () => {
			it('should throw the error', async () => {
				const { error, user } = setup();
				contentRepo.getAllContents.mockRejectedValueOnce(error);

				const listPromise = service.listContent(user);

				await expect(listPromise).rejects.toBe(error);
			});
		});
	});

	describe('listFiles', () => {
		const setup = () => {
			const content = helpers.buildContent().withID();
			const user = helpers.createUser();
			const filenames = ['1.txt', '2.txt'];
			const error = new Error('error occured');

			return { content, filenames, user, error };
		};

		describe('WHEN content exists', () => {
			it('should return list of filenames', async () => {
				const { filenames, content, user } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);
				s3ClientAdapter.list.mockResolvedValueOnce(filenames);

				const files = await service.listFiles(content.id, user);

				expect(files).toEqual(filenames);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw NotFoundException', async () => {
				const { content, user } = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const listPromise = service.listFiles(content.id, user);

				await expect(listPromise).rejects.toBeInstanceOf(NotFoundException);
			});
		});

		describe('WHEN S3ClientAdapter.list throws error', () => {
			it('should throw the error', async () => {
				const { content, user, error } = setup();
				s3ClientAdapter.list.mockRejectedValueOnce(error);

				const listPromise = service.listFiles(content.id, user);

				await expect(listPromise).rejects.toBe(error);
			});
		});

		describe('WHEN ID is empty string', () => {
			it('should throw error', async () => {
				const { user } = setup();

				const listPromise = service.listFiles('', user);

				await expect(listPromise).rejects.toThrow();
			});
		});
	});

	describe('getUsage', () => {
		const setup = () => {
			const library = 'TEST.Library-1.0';
			const libraryName = LibraryName.fromUberName(library);

			const contentMain = helpers.buildContent(0).withID(0);
			const content1 = helpers.buildContent(1).withID(1);
			const content2 = helpers.buildContent(2).withID(2);
			const content3 = helpers.buildContent(3).withID(3);
			const content4 = helpers.buildContent(4).withID(4);

			contentMain.metadata.mainLibrary = libraryName.machineName;
			contentMain.metadata.preloadedDependencies = [libraryName];
			content1.metadata.preloadedDependencies = [libraryName];
			content2.metadata.editorDependencies = [libraryName];
			content3.metadata.dynamicDependencies = [libraryName];

			const contents = [contentMain, content1, content2, content3, content4];

			const findByIdMock = async (id: string) => {
				const content = contents.find((c) => c.id === id);

				if (content) {
					return Promise.resolve(content);
				}

				throw new Error('Not found');
			};

			const expectedUsage = { asDependency: 3, asMainLibrary: 1 };

			return { libraryName, findByIdMock, contents, expectedUsage };
		};

		it('should return the number of times the library is used', async () => {
			const { libraryName, contents, findByIdMock, expectedUsage } = setup();
			contentRepo.findById.mockImplementation(findByIdMock); // Will be called multiple times
			contentRepo.getAllContents.mockResolvedValueOnce(contents);

			const test = await service.getUsage(libraryName);

			expect(test).toEqual(expectedUsage);
		});
	});

	describe('getUserPermissions (currently unused)', () => {
		it('should return array of permissions', async () => {
			const user = helpers.createUser();

			// This method is currently unused and will be changed later
			const permissions = await service.getUserPermissions('id', user);

			expect(permissions.length).toBeGreaterThan(0);
		});
	});

	describe('private methods', () => {
		describe('WHEN calling getContentPath with invalid parameters', () => {
			it('should throw error', async () => {
				// Test private getContentPath using listFiles
				const promise = service.listFiles('');
				await expect(promise).rejects.toThrow('COULD_NOT_CREATE_PATH');
			});
		});

		describe('WHEN calling getFilePath with invalid parameters', () => {
			it('should throw error', async () => {
				// Test private getFilePath using fileExists
				const missingContentID = service.fileExists('', 'filename');
				await expect(missingContentID).rejects.toThrow('COULD_NOT_CREATE_PATH');

				const missingFilename = service.fileExists('id', '');
				await expect(missingFilename).rejects.toThrow('COULD_NOT_CREATE_PATH');
			});
		});

		describe('WHEN calling checkFilename with invalid parameters', () => {
			it('should throw error', async () => {
				// Test private checkFilename using deleteFile
				const invalidChars = service.deleteFile('id', 'ex#ample.txt');
				await expect(invalidChars).rejects.toThrow('Filename contains forbidden characters');

				const includesDoubleDot = service.deleteFile('id', '../test.txt');
				await expect(includesDoubleDot).rejects.toThrow('Filename contains forbidden characters');

				const startsWithSlash = service.deleteFile('id', '/example.txt');
				await expect(startsWithSlash).rejects.toThrow('Filename contains forbidden characters');
			});
		});
	});
});

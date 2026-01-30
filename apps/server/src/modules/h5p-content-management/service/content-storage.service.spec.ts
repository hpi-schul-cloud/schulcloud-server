import { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CopyFiles, S3ClientAdapter } from '@infra/s3-client';
import { s3ObjectKeysRecursiveFactory } from '@infra/s3-client/testing';
import { IContentMetadata, ILibraryName, IUser, LibraryName } from '@lumieducation/h5p-server';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	HttpException,
	InternalServerErrorException,
	NotFoundException,
	NotImplementedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IEntity } from '@shared/domain/interface';
import { Readable } from 'stream';
import { GetH5PFileResponse } from '../controller/dto';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN } from '../h5p-editor.const';
import { H5PContent, H5PContentProperties, H5PContentRepo } from '../repo';
import { h5pContentFactory } from '../testing';
import { H5PContentParentParams, H5PContentParentType, LumiUserWithContentData } from '../types';
import { ContentStorage } from './content-storage.service';

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
		const h5pContentProperties: H5PContentProperties = {
			creatorId: new ObjectId().toString(),
			parentId: new ObjectId().toString(),
			schoolId: new ObjectId().toString(),
			metadata,
			content,
			parentType: H5PContentParentType.BoardElement,
		};
		const h5pContent = new H5PContent(h5pContentProperties);

		return {
			withID(id?: number) {
				const objectId = new ObjectId(id);
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
			email: 'example@schul-cloud.org',
			id: '12345',
			name: 'Example User',
			type: 'user',
		};
	},

	repoSaveMock: <Entity extends IEntity>(entities: Entity | Entity[]) => {
		if (!Array.isArray(entities)) {
			entities = [entities];
		}

		for (const entity of entities) {
			if (!entity._id) {
				const id = new ObjectId();
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
				{ provide: H5PContentRepo, useValue: createMock<H5PContentRepo>() },
				{ provide: H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, useValue: createMock<S3ClientAdapter>() },
			],
		}).compile();

		service = module.get(ContentStorage);
		s3ClientAdapter = module.get(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN);
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

			const iUser: IUser = {
				email: 'example@schul-cloud.org',
				id: new ObjectId().toHexString(),
				name: 'Example User',
				type: 'user',
			};
			const parentParams: H5PContentParentParams = {
				schoolId: new ObjectId().toHexString(),
				parentType: H5PContentParentType.BoardElement,
				parentId: new ObjectId().toHexString(),
			};
			const user = new LumiUserWithContentData(iUser, parentParams);

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
			it('should throw an HttpException', async () => {
				const {
					existingContent: { metadata, content },
					user,
				} = setup();
				contentRepo.save.mockRejectedValueOnce(new Error());

				const addContentPromise = service.addContent(metadata, content, user);

				await expect(addContentPromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN finding content fails', () => {
			it('should throw an HttpException', async () => {
				const {
					existingContent: { metadata, content, id },
					user,
				} = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const addContentPromise = service.addContent(metadata, content, user, id);

				await expect(addContentPromise).rejects.toThrow(HttpException);
			});
		});
	});

	describe('addFile', () => {
		const setup = () => {
			const filename = 'filename.txt';
			const stream = Readable.from('content');

			const contentID = new ObjectId();
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
				const { contentIDString, filename, stream } = setup();

				await service.addFile(contentIDString, filename, stream);

				expect(contentRepo.existsOne).toBeCalledWith(contentIDString);
			});

			it('should call S3ClientAdapter.create', async () => {
				const { contentIDString, filename, stream } = setup();
				contentRepo.existsOne.mockResolvedValueOnce(true);

				await service.addFile(contentIDString, filename, stream);

				expect(s3ClientAdapter.create).toBeCalledWith(
					expect.stringContaining(filename),
					expect.objectContaining({
						name: filename,
						data: stream,
						mimeType: 'application/octet-stream',
					})
				);
			});
		});

		describe('WHEN adding a file to non existant content', () => {
			it('should throw NotFoundException', async () => {
				const { contentIDString, filename, stream } = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const addFilePromise = service.addFile(contentIDString, filename, stream);

				await expect(addFilePromise).rejects.toThrow(NotFoundException);
			});
		});

		describe('WHEN S3ClientAdapter throws error', () => {
			it('should throw the error', async () => {
				const { contentIDString, filename, stream, fileCreateError } = setup();
				contentRepo.existsOne.mockResolvedValueOnce(true);
				s3ClientAdapter.create.mockRejectedValueOnce(fileCreateError);

				const addFilePromise = service.addFile(contentIDString, filename, stream);

				await expect(addFilePromise).rejects.toBe(fileCreateError);
			});
		});

		describe('WHEN content id is empty string', () => {
			it('should throw error', async () => {
				const { filename, stream } = setup();

				const addFilePromise = service.addFile('', filename, stream);

				await expect(addFilePromise).rejects.toThrow();
			});
		});
	});

	describe('contentExists', () => {
		describe('WHEN content does exist', () => {
			it('should return true', async () => {
				const content = helpers.buildContent().withID();
				contentRepo.existsOne.mockResolvedValueOnce(true);

				const exists = await service.contentExists(content.id);

				expect(exists).toBe(true);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should return false', async () => {
				contentRepo.existsOne.mockResolvedValueOnce(false);

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
			// @ts-expect-error test case
			s3ClientAdapter.list.mockResolvedValueOnce({ files });

			return {
				content,
				files,
				user,
			};
		};

		describe('WHEN content exists', () => {
			it('should call H5PContentRepo.delete', async () => {
				const { content } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);
				contentRepo.existsOne.mockResolvedValueOnce(true);

				await service.deleteContent(content.id);

				expect(contentRepo.delete).toHaveBeenCalledWith(content);
			});

			it('should call S3ClientAdapter.deleteFile for every file', async () => {
				const { content, files } = setup();
				contentRepo.findById.mockResolvedValueOnce(content);
				contentRepo.existsOne.mockResolvedValueOnce(true);

				await service.deleteContent(content.id);

				for (const file of files) {
					expect(s3ClientAdapter.delete).toHaveBeenCalledWith([expect.stringContaining(file)]);
				}
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw HttpException', async () => {
				const { content } = setup();
				contentRepo.findById.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id);

				await expect(deletePromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN H5PContentRepo.delete throws an error', () => {
			it('should throw HttpException', async () => {
				const { content } = setup();
				contentRepo.delete.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id);

				await expect(deletePromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN S3ClientAdapter.delete throws an error', () => {
			it('should throw HttpException', async () => {
				const { content } = setup();
				s3ClientAdapter.delete.mockRejectedValueOnce(new Error());

				const deletePromise = service.deleteContent(content.id);

				await expect(deletePromise).rejects.toThrow(HttpException);
			});
		});
	});

	describe('deleteFile', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const user = helpers.createUser();

			const deleteError = new Error('Could not delete');

			const contentID = new ObjectId().toString();

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
				const { contentID, filename } = setup();

				await service.deleteFile(contentID, filename);

				expect(s3ClientAdapter.delete).toHaveBeenCalledWith([expect.stringContaining(contentID)]);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', async () => {
				const { contentID, invalidFilename } = setup();

				const deletePromise = service.deleteFile(contentID, invalidFilename);

				await expect(deletePromise).rejects.toThrow();
			});
		});

		describe('WHEN S3ClientAdapter throws an error', () => {
			it('should throw along the error', async () => {
				const { contentID, filename, deleteError } = setup();
				s3ClientAdapter.delete.mockRejectedValueOnce(deleteError);

				const deletePromise = service.deleteFile(contentID, filename);

				await expect(deletePromise).rejects.toBe(deleteError);
			});
		});
	});

	describe('fileExists', () => {
		const setup = () => {
			const filename = 'file.txt';
			const invalidFilename = '..test.txt';

			const deleteError = new Error('Could not delete');

			const contentID = new ObjectId().toString();

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
				// s3ClientAdapter.head.mockRejectedValueOnce(new NotFoundException('NoSuchKey'));
				s3ClientAdapter.get.mockRejectedValue(new NotFoundException('NoSuchKey'));

				const exists = await service.fileExists(contentID, filename);

				expect(exists).toBe(false);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw HttpException', async () => {
				const { contentID, filename } = setup();
				s3ClientAdapter.get.mockRejectedValueOnce(new Error());

				const existsPromise = service.fileExists(contentID, filename);

				await expect(existsPromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN filename is invalid', () => {
			it('should throw error', () => {
				const { contentID, invalidFilename } = setup();

				expect(() => service.fileExists(contentID, invalidFilename)).toThrow();
			});
		});
	});

	describe('getFileStats', () => {
		const setup = () => {
			const filename = 'file.txt';

			const user = helpers.createUser();

			const contentID = new ObjectId().toString();

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
				const { filename, contentID, headResponse, size, birthtime } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponse);

				const stats = await service.getFileStats(contentID, filename);

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
				const { filename, contentID, headResponseWithoutContentLength } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponseWithoutContentLength);

				const statsPromise = service.getFileStats(contentID, filename);

				await expect(statsPromise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('WHEN response from S3 is missing LastModified field', () => {
			it('should throw InternalServerError', async () => {
				const { filename, contentID, headResponseWithoutLastModified } = setup();
				s3ClientAdapter.head.mockResolvedValueOnce(headResponseWithoutLastModified);

				const statsPromise = service.getFileStats(contentID, filename);

				await expect(statsPromise).rejects.toThrow(InternalServerErrorException);
			});
		});

		describe('WHEN S3ClientAdapter.head throws error', () => {
			it('should throw the error', async () => {
				const { filename, contentID, headError } = setup();
				s3ClientAdapter.head.mockRejectedValueOnce(headError);

				const statsPromise = service.getFileStats(contentID, filename);

				await expect(statsPromise).rejects.toBe(headError);
			});
		});
	});

	describe('getFileStream', () => {
		const setup = () => {
			const filename = 'testfile.txt';
			const fileStream = Readable.from('content');
			const contentID = new ObjectId().toString();
			const fileResponse = createMock<GetH5PFileResponse>({ data: fileStream });
			const user = helpers.createUser();

			const getError = new Error('Could not get file');

			// [start, end, expected range]
			const testRanges = [
				[undefined, undefined, undefined],
				[100, undefined, undefined],
				[undefined, 100, undefined],
				[100, 999, 'bytes=100-999'],
			] as const;

			return { filename, contentID, fileStream, fileResponse, testRanges, user, getError };
		};

		describe('WHEN file exists', () => {
			it('should S3ClientAdapter.get with range', async () => {
				const { testRanges, contentID, filename, user, fileResponse } = setup();

				for (const range of testRanges) {
					s3ClientAdapter.get.mockResolvedValueOnce(fileResponse);

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
		describe('WHEN querying for contents', () => {
			it('should throw not implemented exception', () => {
				const error = new NotImplementedException('Method not implemented.');

				expect(() => service.listContent()).toThrow(error);
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
				const { filenames, content } = setup();
				contentRepo.existsOne.mockResolvedValueOnce(true);
				// @ts-expect-error test case
				s3ClientAdapter.list.mockResolvedValueOnce({ files: filenames });

				const files = await service.listFiles(content.id);

				expect(files).toEqual(filenames);
			});
		});

		describe('WHEN content does not exist', () => {
			it('should throw HttpException', async () => {
				const { content } = setup();
				contentRepo.existsOne.mockResolvedValueOnce(false);

				const listPromise = service.listFiles(content.id);

				await expect(listPromise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN S3ClientAdapter.list throws error', () => {
			it('should throw the error', async () => {
				const { content, error } = setup();
				contentRepo.existsOne.mockResolvedValueOnce(true);
				s3ClientAdapter.list.mockRejectedValueOnce(error);

				const listPromise = service.listFiles(content.id);

				await expect(listPromise).rejects.toBe(error);
			});
		});

		describe('WHEN ID is empty string', () => {
			it('should throw error', async () => {
				const listPromise = service.listFiles('');

				await expect(listPromise).rejects.toThrow();
			});
		});
	});

	describe('getUsage', () => {
		const setup = () => {
			const libraryName = LibraryName.fromUberName('TEST.Library-1.0');
			const expectedUsage = { asDependency: 3, asMainLibrary: 1 };

			contentRepo.countUsage.mockResolvedValueOnce(expectedUsage);

			return { libraryName, expectedUsage };
		};

		it('should return the counted database result', async () => {
			const { libraryName, expectedUsage } = setup();

			const test = await service.getUsage(libraryName);

			expect(test).toEqual(expectedUsage);
		});
	});

	describe('private methods', () => {
		describe('WHEN calling getContentPath with invalid parameters', () => {
			it('should throw error', async () => {
				// Test private getContentPath using listFiles
				contentRepo.existsOne.mockResolvedValueOnce(true);
				const promise = service.listFiles('');
				await expect(promise).rejects.toThrow(HttpException);
			});
		});

		describe('WHEN calling getFilePath with invalid parameters', () => {
			it('should throw error', () => {
				expect(() => service.fileExists('', 'filename')).toThrow(HttpException);
				expect(() => service.fileExists('id', '')).toThrow(HttpException);
			});
		});

		describe('WHEN calling checkFilename with invalid parameters', () => {
			it('should throw error', async () => {
				// Test private checkFilename using deleteFile
				const invalidChars = service.deleteFile('id', 'ex#ample.txt');
				await expect(invalidChars).rejects.toThrow(HttpException);

				const includesDoubleDot = service.deleteFile('id', '../test.txt');
				await expect(includesDoubleDot).rejects.toThrow(HttpException);

				const startsWithSlash = service.deleteFile('id', '/example.txt');
				await expect(startsWithSlash).rejects.toThrow(HttpException);
			});
		});
	});

	describe('copyAllFiles', () => {
		describe('when source and target content id are passed', () => {
			const setup = () => {
				const [sourceContent, targetContent] = h5pContentFactory.buildList(2);
				const listedFiles = s3ObjectKeysRecursiveFactory.build();

				const filesToBeCopied: CopyFiles[] = listedFiles.files.map((filename) => {
					return {
						sourcePath: `h5p-content/${sourceContent.id}/${filename}`,
						targetPath: `h5p-content/${targetContent.id}/${filename}`,
					};
				});

				contentRepo.existsOne.mockResolvedValueOnce(true);
				s3ClientAdapter.list.mockResolvedValueOnce(listedFiles);

				return { sourceContentId: sourceContent.id, targetContentId: targetContent.id, filesToBeCopied };
			};

			it('should copy all the files from the source to the target content storage', async () => {
				const { sourceContentId, targetContentId, filesToBeCopied } = setup();

				await service.copyAllFiles(sourceContentId, targetContentId);

				expect(s3ClientAdapter.copy).toHaveBeenCalledWith(filesToBeCopied);
			});
		});
	});
});

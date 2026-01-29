import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { IFileStats, ILibraryName } from '@lumieducation/h5p-server';
import { ContentMetadata } from '@lumieducation/h5p-server/build/src/ContentMetadata';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { Readable } from 'stream';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { H5PContent, H5PContentProperties } from '../../repo';
import { ContentStorage, LibraryStorage, TemporaryFileStorage } from '../../service';
import { h5pContentFactory } from '../../testing';
import { H5PContentParentType } from '../../types';

const helpers = {
	buildMetadata(
		title: string,
		mainLibrary: string,
		preloadedDependencies: ILibraryName[] = [],
		dynamicDependencies?: ILibraryName[],
		editorDependencies?: ILibraryName[]
	): ContentMetadata {
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
};

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;

	let contentStorage: DeepMocked<ContentStorage>;
	let libraryStorage: DeepMocked<LibraryStorage>;
	let temporaryStorage: DeepMocked<TemporaryFileStorage>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(ContentStorage)
			.useValue(createMock<ContentStorage>())
			.overrideProvider(LibraryStorage)
			.useValue(createMock<LibraryStorage>())
			.overrideProvider(TemporaryFileStorage)
			.useValue(createMock<TemporaryFileStorage>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		contentStorage = app.get(ContentStorage);
		libraryStorage = app.get(LibraryStorage);
		temporaryStorage = app.get(TemporaryFileStorage);
		testApiClient = new TestApiClient(app, 'h5p-editor');
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when requesting library files', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('libraries/dummyLib/test.txt');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { loggedInClient };
			};

			it('should return the library file', async () => {
				const { loggedInClient } = setup();

				const mockFile = { content: 'Test File', size: 9, name: 'test.txt', birthtime: new Date() };

				libraryStorage.getLibraryFile.mockResolvedValueOnce({
					stream: Readable.from(mockFile.content),
					size: mockFile.size,
					mimetype: 'text/plain',
				});

				const response = await loggedInClient.get(`libraries/dummyLib-1.0/${mockFile.name}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.text).toBe(mockFile.content);
			});

			it('should return 404 if file does not exist', async () => {
				const { loggedInClient } = setup();

				libraryStorage.getLibraryFile.mockRejectedValueOnce(new Error('Does not exist'));

				const response = await loggedInClient.get(`libraries/dummyLib-1.0/nonexistant.txt`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('when requesting content files', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('content/dummyId/test.txt');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is logged in', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				const parentId = new ObjectId().toString();

				const content = h5pContentFactory.build({ parentId, parentType: H5PContentParentType.BoardElement });
				await em.persist([content]).flush();
				em.clear();

				return { loggedInClient, content };
			};

			it('should return the content file', async () => {
				const { loggedInClient, content } = await setup();

				const mockFile = { content: 'Test File', size: 9, name: 'test.txt', birthtime: new Date() };

				contentStorage.getFileStream.mockResolvedValueOnce(Readable.from(mockFile.content));
				contentStorage.getFileStats.mockResolvedValueOnce({ birthtime: mockFile.birthtime, size: mockFile.size });

				const response = await loggedInClient.get(`content/${content.id}/${mockFile.name}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.text).toBe(mockFile.content);
			});

			it('should work with range requests', async () => {
				const { loggedInClient, content } = await setup();

				const mockFile = { content: 'Test File', size: 9, name: 'test.txt', birthtime: new Date() };

				contentStorage.getFileStream.mockResolvedValueOnce(Readable.from(mockFile.content));
				contentStorage.getFileStats.mockResolvedValueOnce({ birthtime: mockFile.birthtime, size: mockFile.size });

				const response = await loggedInClient.get(`content/${content.id}/${mockFile.name}`).set('Range', 'bytes=2-4');

				expect(response.statusCode).toEqual(HttpStatus.PARTIAL_CONTENT);
				expect(response.text).toBe(mockFile.content);
			});

			it('should return 404 if file does not exist', async () => {
				const { loggedInClient, content } = await setup();

				contentStorage.getFileStats.mockRejectedValueOnce(new Error('Does not exist'));

				const response = await loggedInClient.get(`content/${content.id}/nonexistant.txt`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('when requesting temporary files', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('temp-files/test.txt');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				const mockFile = {
					name: 'example.txt',
					content: 'File Content',
				};

				const mockFileStats: IFileStats = {
					birthtime: new Date(),
					size: mockFile.content.length,
				};

				return { loggedInClient, mockFile, mockFileStats };
			};

			it('should return the content file', async () => {
				const { loggedInClient, mockFile, mockFileStats } = setup();

				temporaryStorage.getFileStream.mockResolvedValueOnce(Readable.from(mockFile.content));
				temporaryStorage.getFileStats.mockResolvedValueOnce(mockFileStats);

				const response = await loggedInClient.get(`temp-files/${mockFile.name}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.text).toBe(mockFile.content);
			});

			it('should work with range requests', async () => {
				const { loggedInClient, mockFile, mockFileStats } = setup();

				temporaryStorage.getFileStream.mockResolvedValueOnce(Readable.from(mockFile.content));
				temporaryStorage.getFileStats.mockResolvedValueOnce(mockFileStats);

				const response = await loggedInClient.get(`temp-files/${mockFile.name}`).set('Range', 'bytes=2-4');

				expect(response.statusCode).toEqual(HttpStatus.PARTIAL_CONTENT);
				expect(response.text).toBe(mockFile.content);
			});

			it('should return 404 if file does not exist', async () => {
				const { loggedInClient } = setup();

				temporaryStorage.getFileStats.mockRejectedValueOnce(new Error('Does not exist'));

				const response = await loggedInClient.get(`temp-files/nonexistant.txt`);

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('when requesting content parameters', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('params/dummyId');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when user is logged in', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				const parentId = new ObjectId().toString();

				const content = h5pContentFactory.build({ parentId, parentType: H5PContentParentType.BoardElement });
				await em.persist([content]).flush();
				em.clear();

				return { loggedInClient, content };
			};

			it('should return the content parameters', async () => {
				const { loggedInClient, content } = await setup();

				const dummyMetadata = new ContentMetadata();
				const dummyParams = { name: 'Dummy' };

				contentStorage.getMetadata.mockResolvedValueOnce(dummyMetadata);
				contentStorage.getParameters.mockResolvedValueOnce(dummyParams);
				const response = await loggedInClient.get(`params/${content.id}`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					h5p: dummyMetadata,
					params: { metadata: dummyMetadata, params: dummyParams },
				});
			});

			it('should return 404 if content does not exist', async () => {
				const { loggedInClient } = await setup();

				contentStorage.getMetadata.mockRejectedValueOnce(new Error('Does not exist'));

				const response = await loggedInClient.get('params/dummyId');

				expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});

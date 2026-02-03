import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor, IContentMetadata } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { H5PContentParentType } from '../../types';
import { PostH5PContentCreateParams } from '../dto';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let h5pEditor: DeepMocked<H5PEditor>;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		h5pEditor = module.get(H5PEditor);
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'h5p-editor');
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('create h5p content', () => {
		describe('with valid request params', () => {
			const setup = () => {
				const id = '0000000';
				const metadata: IContentMetadata = {
					embedTypes: [],
					language: 'de',
					mainLibrary: 'mainLib',
					preloadedDependencies: [],
					defaultLanguage: '',
					license: '',
					title: '123',
				};
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};

				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});
	});

	describe('save h5p content', () => {
		describe('when request params are valid', () => {
			const setup = () => {
				const contentId = new ObjectId(0);
				const id = '0000000';
				const metadata: IContentMetadata = {
					embedTypes: [],
					language: 'de',
					mainLibrary: 'mainLib',
					preloadedDependencies: [],
					defaultLanguage: '',
					license: '',
					title: '123',
				};
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { contentId, id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { contentId, loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit/${contentId.toString()}`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when id is not mongo id', () => {
			const setup = () => {
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.BoardElement,
					parentId: new ObjectId().toString(),
					params: {
						params: undefined,
						metadata: {
							embedTypes: [],
							language: '',
							mainLibrary: '',
							preloadedDependencies: [],
							defaultLanguage: '',
							license: '',
							title: '',
						},
					},
					library: '123',
				};
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				return { loggedInClient, params };
			};

			it('should return BAD_REQUEST status', async () => {
				const { loggedInClient, params } = setup();

				const response = await loggedInClient.post(`/edit/123`, params);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});

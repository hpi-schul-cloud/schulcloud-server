import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor, IContentMetadata } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { H5PContentParentType } from '../../entity';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';
import { PostH5PContentCreateParams } from '../dto';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let h5pEditor: DeepMocked<H5PEditor>;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CONNECTION)
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
			const setup = async () => {
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
					parentType: H5PContentParentType.Lesson,
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

				const createStudent = () => UserAndAccountTestFactory.buildStudent();
				const { studentAccount, studentUser } = createStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(studentAccount);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { loggedInClient, params } = await setup();

				const response = await loggedInClient.post(`/edit`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});
	});

	describe('save h5p content', () => {
		describe('when request params are valid', () => {
			const setup = async () => {
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
					parentType: H5PContentParentType.Lesson,
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
				const createStudent = () => UserAndAccountTestFactory.buildStudent();
				const { studentAccount, studentUser } = createStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(studentAccount);

				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);

				return { contentId, id, metadata, loggedInClient, params };
			};

			it('should return CREATED status', async () => {
				const { contentId, loggedInClient, params } = await setup();

				const response = await loggedInClient.post(`/edit/${contentId.toString()}`, params);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when id is not mongo id', () => {
			const setup = async () => {
				const params: PostH5PContentCreateParams = {
					parentType: H5PContentParentType.Lesson,
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
				const createStudent = () => UserAndAccountTestFactory.buildStudent();
				const { studentAccount, studentUser } = createStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, params };
			};

			it('should return BAD_REQUEST status', async () => {
				const { loggedInClient, params } = await setup();

				const response = await loggedInClient.post(`/edit/123`, params);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});

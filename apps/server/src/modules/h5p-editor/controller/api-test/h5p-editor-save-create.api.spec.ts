import { DeepMocked, createMock } from '@golevelup/ts-jest/lib/mocks';
import { IContentMetadata } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { S3ClientAdapter } from '@infra/s3-client';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { H5PContentParentType } from '../../entity';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';
import { H5PEditorUc } from '../../uc/h5p.uc';
import { PostH5PContentCreateParams } from '../dto';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let h5PEditorUc: DeepMocked<H5PEditorUc>;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PEditorUc)
			.useValue(createMock<H5PEditorUc>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		h5PEditorUc = module.get(H5PEditorUc);
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'h5p-editor');
	});

	afterAll(async () => {
		await app.close();
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

				return { id, metadata, loggedInClient, params };
			};
			it('should return 201 status', async () => {
				const { id, metadata, loggedInClient, params } = await setup();
				const result1 = { id, metadata };
				h5PEditorUc.createH5pContentGetMetadata.mockResolvedValueOnce(result1);
				const response = await loggedInClient.post(`/edit`, params);
				expect(response.status).toEqual(201);
			});
		});
	});
	describe('save h5p content', () => {
		describe('with valid request params', () => {
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

				return { contentId, id, metadata, loggedInClient, params };
			};
			it('should return 201 status', async () => {
				const { contentId, id, metadata, loggedInClient, params } = await setup();
				const result1 = { id, metadata };
				h5PEditorUc.saveH5pContentGetMetadata.mockResolvedValueOnce(result1);
				const response = await loggedInClient.post(`/edit/${contentId.toString()}`, params);

				expect(response.status).toEqual(201);
			});
		});
		describe('with bad request params', () => {
			const setup = async () => {
				const notExistingContentId = new ObjectId(1);
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

				return { notExistingContentId, loggedInClient, params };
			};
			it('should return 500 status', async () => {
				const { notExistingContentId, loggedInClient, params } = await setup();
				h5PEditorUc.saveH5pContentGetMetadata.mockRejectedValueOnce(new Error('Could not save H5P content'));
				const response = await loggedInClient.post(`/edit/${notExistingContentId.toString()}`, params);

				expect(response.status).toEqual(500);
			});
		});
	});
});

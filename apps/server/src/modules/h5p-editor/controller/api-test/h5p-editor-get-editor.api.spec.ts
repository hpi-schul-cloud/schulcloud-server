import { createMock, DeepMocked } from '@golevelup/ts-jest/lib/mocks';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor, IContentMetadata } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
	cleanupCollections,
	h5pContentFactory,
	lessonFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { AuthorizationClientAdapter } from '@src/infra/authorization-client';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';

const buildContent = () => {
	const contentId = new ObjectId(0).toString();
	const notExistingContentId = new ObjectId(1).toString();
	const badContentId = '';

	const editorModel = {
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	const exampleContent = {
		h5p: createMock<IContentMetadata>(),
		library: 'ExampleLib-1.0',
		params: {
			metadata: createMock<IContentMetadata>(),
			params: { anything: true },
		},
	};

	return { contentId, notExistingContentId, badContentId, editorModel, exampleContent };
};

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;
	let h5pEditor: DeepMocked<H5PEditor>;

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

		testApiClient = new TestApiClient(app, '/h5p-editor/edit');
		em = module.get(EntityManager);
		h5pEditor = module.get(H5PEditor);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('get new h5p editor', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const response = await testApiClient.get('de');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when editor is created successfully', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					const { editorModel } = buildContent();
					h5pEditor.render.mockResolvedValueOnce(editorModel);

					return { loggedInClient };
				};

				it('should return OK status', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get('de');

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when editor throws error', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					h5pEditor.render.mockRejectedValueOnce(new Error('Could not get H5P editor'));

					return { loggedInClient };
				};

				it('should return INTERNAL_SERVER_ERROR status', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get('de');

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});
		});
	});

	describe('get h5p editor', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const response = await testApiClient.get('123/de');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when editor is returned successfully', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
					const lesson = lessonFactory.build();
					const h5pContent = h5pContentFactory.build({ parentId: lesson.id });

					await em.persistAndFlush([teacherAccount, teacherUser, lesson, h5pContent]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					const { editorModel, exampleContent } = buildContent();
					h5pEditor.render.mockResolvedValueOnce({ editorModel, content: exampleContent });
					h5pEditor.getContent.mockResolvedValueOnce(exampleContent);

					return { loggedInClient, contentId: h5pContent.id };
				};

				it('should return 200 status', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`${contentId}/de`);

					expect(response.status).toEqual(200);
				});
			});

			describe('when content is not existing', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					const { contentId } = buildContent();

					return { loggedInClient, contentId };
				};

				it('should return 200 status', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.get(`${contentId}/de`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when id is not a mongo id', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient };
				};

				it('should return 200 status', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.get(`123/de`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
});

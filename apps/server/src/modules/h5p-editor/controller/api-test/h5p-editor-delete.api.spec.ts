import { createMock } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor } from '@lumieducation/h5p-server';
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
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'h5p-editor');
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('delete h5p content', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.post(`delete/${someId}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			describe('when id in params is not a mongo id', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

					await em.persistAndFlush([studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient };
				};

				it('should return 400', async () => {
					const { loggedInClient } = await setup();

					const response = await loggedInClient.post(`delete/123`);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [{ errors: ['contentId must be a mongodb id'], field: ['contentId'] }],
						})
					);
				});
			});

			describe('when requested content is not found', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

					await em.persistAndFlush([studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient };
				};

				it('should return 404', async () => {
					const { loggedInClient } = await setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.post(`delete/${someId}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when content is found', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
					const lesson = lessonFactory.build();
					const h5pContent = h5pContentFactory.build({ parentId: lesson.id });

					await em.persistAndFlush([lesson, h5pContent, teacherAccount, teacherUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { contentId: h5pContent.id, loggedInClient };
				};

				it('should respond with code 201', async () => {
					const { contentId, loggedInClient } = await setup();

					const response = await loggedInClient.post(`delete/${contentId}`);

					expect(response.status).toEqual(HttpStatus.CREATED);
				});
			});
		});
	});
});

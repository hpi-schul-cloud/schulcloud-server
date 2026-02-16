import { createMock } from '@golevelup/ts-jest/lib/mocks';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { H5PEditor } from '@lumieducation/h5p-server';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';
import { h5pContentFactory } from '../../testing';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
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
		jwtConfig = moduleFixture.get(TEST_JWT_CONFIG_TOKEN);
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
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					return { loggedInClient };
				};

				it('should return 400', async () => {
					const { loggedInClient } = setup();

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
				const setup = () => {
					const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

					const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

					return { loggedInClient };
				};

				it('should return 404', async () => {
					const { loggedInClient } = setup();
					const someId = new ObjectId().toHexString();

					const response = await loggedInClient.post(`delete/${someId}`);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when content is found', () => {
				const setup = async () => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

					const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

					const parentId = new ObjectId().toHexString();
					const h5pContent = h5pContentFactory.build({ parentId });

					await em.persist([h5pContent]).flush();
					em.clear();

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

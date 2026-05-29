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

describe('H5PEditor Controller - Content User Data (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
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

		testApiClient = new TestApiClient(app, '/h5p-editor/contentUserData');
		em = module.get(EntityManager);
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	describe('GET contentUserData/:contentId/:dataType/:subContentId', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const contentId = new ObjectId().toHexString();
				const response = await testApiClient.get(`${contentId}/state/0`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const contentId = new ObjectId().toHexString();

				return { loggedInClient, contentId };
			};

			it('should return 200 status', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.get(`${contentId}/state/0`);

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return empty data with success true', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.get(`${contentId}/state/0`);

				expect(response.body).toEqual({ data: null, success: true });
			});

			it('should work with different dataType values', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.get(`${contentId}/H5P-DragText-textField-important/0`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ data: null, success: true });
			});
		});
	});

	describe('POST contentUserData/:contentId/:dataType/:subContentId', () => {
		describe('when user is not logged in', () => {
			it('should return UNAUTHORIZED status', async () => {
				const contentId = new ObjectId().toHexString();
				const response = await testApiClient.post(`${contentId}/state/0`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			const setup = () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();
				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);
				const contentId = new ObjectId().toHexString();

				return { loggedInClient, contentId };
			};

			it('should return 201 status', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.post(`${contentId}/state/0`).send({ someData: 'value' });

				expect(response.status).toEqual(HttpStatus.CREATED);
			});

			it('should return success true', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.post(`${contentId}/state/0`).send({ someData: 'value' });

				expect(response.body).toEqual({ success: true });
			});

			it('should accept empty body', async () => {
				const { loggedInClient, contentId } = setup();

				const response = await loggedInClient.post(`${contentId}/state/0`);

				expect(response.status).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual({ success: true });
			});
		});
	});
});

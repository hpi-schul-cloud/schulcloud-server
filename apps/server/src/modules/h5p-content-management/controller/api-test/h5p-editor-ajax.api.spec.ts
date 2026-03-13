import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { S3ClientAdapter } from '@infra/s3-client';
import { AjaxErrorResponse, H5PAjaxEndpoint, H5pError } from '@lumieducation/h5p-server';
import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN, H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN } from '../../h5p-editor.const';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let jwtConfig: TestJwtModuleConfig;

	let ajaxEndpoint: DeepMocked<H5PAjaxEndpoint>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		})
			.overrideProvider(H5P_CONTENT_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CLIENT_INJECTION_TOKEN)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PAjaxEndpoint)
			.useValue(createMock<H5PAjaxEndpoint>())
			.overrideProvider(AuthorizationClientAdapter)
			.useValue(createMock<AuthorizationClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		ajaxEndpoint = app.get(H5PAjaxEndpoint);
		testApiClient = new TestApiClient(app, 'h5p-editor');
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterEach(async () => {
		jest.resetAllMocks();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when calling AJAX GET', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('ajax');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual(new AjaxErrorResponse('', 401, 'UnauthorizedException', 'Unauthorized'));
			});
		});

		describe('when user is logged in', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				await em.persist([studentUser]).flush();
				em.clear();

				const dummyResponse = {
					apiVersion: { major: 1, minor: 1 },
					details: [],
					libraries: [],
					outdated: false,
					recentlyUsed: [],
					user: 'DummyUser',
				};

				ajaxEndpoint.getAjax.mockResolvedValueOnce(dummyResponse);

				return { loggedInClient, studentUser, dummyResponse };
			};

			it('should call H5PAjaxEndpoint', async () => {
				const {
					loggedInClient,
					studentUser: { id },
					dummyResponse,
				} = await setup();

				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(dummyResponse);
				expect(ajaxEndpoint.getAjax).toHaveBeenCalledWith(
					'content-type-cache',
					undefined, // MachineName
					undefined, // MajorVersion
					undefined, // MinorVersion
					'de', // Language
					expect.objectContaining({ id })
				);
			});
		});

		describe('when an error is thrown', () => {
			const setup = async () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

				await em.persist([teacherUser]).flush();
				em.clear();

				const exception = new H5pError('error-id');
				exception.httpStatusCode = 500;
				exception.clientErrorId = 'get-ajax-client-error-id';
				exception.name = 'get-ajax-error-title';
				exception.message = 'get-ajax-error-description';

				ajaxEndpoint.getAjax.mockRejectedValueOnce(exception);

				return { loggedInClient, teacherUser, exception };
			};

			it('should return an AjaxErrorResponse with correct error status code', async () => {
				const { loggedInClient, exception } = await setup();

				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.status).toEqual(exception.httpStatusCode);
				expect(response.body).toEqual(
					new AjaxErrorResponse(
						exception.clientErrorId as string,
						exception.httpStatusCode,
						exception.name,
						exception.message
					)
				);
			});
		});
	});

	describe('when calling AJAX POST', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.post('ajax');

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual(new AjaxErrorResponse('', 401, 'UnauthorizedException', 'Unauthorized'));
			});
		});

		describe('when user is logged in', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

				const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig);

				await em.persist([studentUser]).flush();
				em.clear();

				const dummyResponse = [
					{
						majorVersion: 1,
						minorVersion: 2,
						metadataSettings: {},
						name: 'Dummy Library',
						restricted: false,
						runnable: true,
						title: 'Dummy Library',
						tutorialUrl: '',
						uberName: 'dummyLibrary-1.1',
					},
				];

				const dummyBody = { contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' };

				ajaxEndpoint.postAjax.mockResolvedValueOnce(dummyResponse);

				return { loggedInClient, studentUser, dummyResponse, dummyBody };
			};

			it('should call H5PAjaxEndpoint', async () => {
				const {
					loggedInClient,
					studentUser: { id },
					dummyResponse,
					dummyBody,
				} = await setup();

				const response = await loggedInClient.post(`ajax?action=libraries`, dummyBody);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toEqual(dummyResponse);
				expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
					'libraries',
					dummyBody,
					'de',
					expect.objectContaining({ id }),
					undefined,
					undefined,
					undefined,
					undefined
				);
			});
		});

		describe('when an error is thrown', () => {
			const setup = async () => {
				const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher();

				const loggedInClient = testApiClient.loginByUser(teacherAccount, teacherUser, jwtConfig);

				await em.persist([teacherUser]).flush();
				em.clear();

				const exception = new H5pError('error-id');
				exception.httpStatusCode = 404;
				exception.clientErrorId = 'post-ajax-client-error-id';
				exception.name = 'post-ajax-error-title';
				exception.message = 'post-ajax-error-description';

				ajaxEndpoint.getAjax.mockRejectedValueOnce(exception);

				return { loggedInClient, teacherUser, exception };
			};

			it('should return an AjaxErrorResponse with the correct error status code', async () => {
				const { loggedInClient, exception } = await setup();

				const response = await loggedInClient.get(`ajax?action=content-type-cache`);

				expect(response.status).toEqual(exception.httpStatusCode);
				expect(response.body).toEqual(
					new AjaxErrorResponse(
						exception.clientErrorId as string,
						exception.httpStatusCode,
						exception.name,
						exception.message
					)
				);
			});
		});
	});
});

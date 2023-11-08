import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5PAjaxEndpoint } from '@lumieducation/h5p-server';
import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { S3ClientAdapter } from '@infra/s3-client';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { H5PEditorTestModule } from '../../h5p-editor-test.module';
import { H5P_CONTENT_S3_CONNECTION, H5P_LIBRARIES_S3_CONNECTION } from '../../h5p-editor.config';

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	let ajaxEndpoint: DeepMocked<H5PAjaxEndpoint>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5P_CONTENT_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5P_LIBRARIES_S3_CONNECTION)
			.useValue(createMock<S3ClientAdapter>())
			.overrideProvider(H5PAjaxEndpoint)
			.useValue(createMock<H5PAjaxEndpoint>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		ajaxEndpoint = app.get(H5PAjaxEndpoint);
		testApiClient = new TestApiClient(app, 'h5p-editor');
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when calling AJAX GET', () => {
		describe('when user not exists', () => {
			it('should respond with unauthorized exception', async () => {
				const response = await testApiClient.get('ajax');

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
			const createStudent = () => UserAndAccountTestFactory.buildStudent();

			const setup = async () => {
				const { studentAccount, studentUser } = createStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should call H5PAjaxEndpoint', async () => {
				const {
					loggedInClient,
					studentUser: { id },
				} = await setup();

				const dummyResponse = {
					apiVersion: { major: 1, minor: 1 },
					details: [],
					libraries: [],
					outdated: false,
					recentlyUsed: [],
					user: 'DummyUser',
				};

				ajaxEndpoint.getAjax.mockResolvedValueOnce(dummyResponse);

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

		describe('when calling AJAX POST', () => {
			describe('when user not exists', () => {
				it('should respond with unauthorized exception', async () => {
					const response = await testApiClient.post('ajax');

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
				const createStudent = () => UserAndAccountTestFactory.buildStudent();

				const setup = async () => {
					const { studentAccount, studentUser } = createStudent();

					await em.persistAndFlush([studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					return { loggedInClient, studentUser };
				};

				it('should call H5PAjaxEndpoint', async () => {
					const {
						loggedInClient,
						studentUser: { id },
					} = await setup();

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
						undefined,
						undefined
					);
				});
			});
		});
	});
});

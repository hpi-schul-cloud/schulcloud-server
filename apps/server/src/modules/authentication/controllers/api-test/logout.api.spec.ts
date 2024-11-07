import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { JwtAuthGuard } from '@infra/auth-guard';
import { ServerTestModule } from '@modules/server/server.module';
import { serverConfig, ServerConfig } from '@modules/server';
import { oauthSessionTokenEntityFactory } from '@modules/oauth/testing';
import { OauthConfig } from '@modules/system';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import {
	axiosErrorFactory,
	axiosResponseFactory,
	cleanupCollections,
	currentUserFactory,
	systemEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { EntityId } from '@shared/domain/types';
import { Cache } from 'cache-manager';
import { Response } from 'supertest';
import { Request } from 'express';
import { of, throwError } from 'rxjs';

describe('Logout Controller (api)', () => {
	const baseRouteName = '/logout';

	let app: INestApplication;
	let em: EntityManager;
	let cacheManager: Cache;
	let testApiClient: TestApiClient;

	afterAll(async () => {
		await app.close();
	});

	describe('logout', () => {
		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			em = app.get(EntityManager);
			cacheManager = app.get(CACHE_MANAGER);
			testApiClient = new TestApiClient(app, baseRouteName);
		});

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		describe('when a valid jwt is provided', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					studentAccount,
				};
			};

			it('should log out the user', async () => {
				const { loggedInClient, studentAccount } = await setup();

				const response: Response = await loggedInClient.post('');

				expect(response.status).toEqual(HttpStatus.OK);
				expect(await cacheManager.store.keys(`jwt:${studentAccount.id}:*`)).toHaveLength(0);
			});
		});

		describe('when the user is not logged in', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.post('');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('externalSystemLogout', () => {
		const mockedUserId: EntityId = new ObjectId().toHexString();
		const mockedSystemId: EntityId = new ObjectId().toHexString();

		const setupTest = async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			em = app.get(EntityManager);
			cacheManager = app.get(CACHE_MANAGER);
			testApiClient = new TestApiClient(app, baseRouteName);
		};

		const setupTestWithMocks = async (mockHttpPostSuccess = true) => {
			const postMockReturnValue = mockHttpPostSuccess
				? of(axiosResponseFactory.build())
				: throwError(() => axiosErrorFactory.build());

			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUserFactory.build({
							userId: mockedUserId,
							systemId: mockedSystemId,
							isExternalUser: true,
						});
						return true;
					},
				})
				.overrideProvider(HttpService)
				.useValue({
					post: () => postMockReturnValue,
				})
				.compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			em = app.get(EntityManager);
			cacheManager = app.get(CACHE_MANAGER);
			testApiClient = new TestApiClient(app, baseRouteName);
		};

		beforeEach(async () => {
			await cleanupCollections(em);
		});

		describe('when the user is not logged in', () => {
			beforeAll(async () => {
				await setupTest();
			});

			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.post('/external');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user is logged in with "SANIS" system', () => {
			describe('when the feature flag is not enabled', () => {
				beforeAll(async () => {
					const config: ServerConfig = serverConfig();
					config.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = false;
					await setupTestWithMocks();
				});

				it('should return status 403', async () => {
					const response: Response = await testApiClient.post('/external');

					expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the external logout can be successfully done', () => {
				beforeAll(async () => {
					const config: ServerConfig = serverConfig();
					config.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = true;
					await setupTestWithMocks();
				});

				const setup = async () => {
					const user = userFactory.build();
					user.id = mockedUserId;
					const sessionToken = oauthSessionTokenEntityFactory.buildWithId({
						user,
					});

					const system = systemEntityFactory.withOauthConfig().build({ alias: 'SANIS' });
					system.id = mockedSystemId;

					await em.persistAndFlush([user, system, sessionToken]);
					em.clear();
				};

				it('should return status 200', async () => {
					await setup();

					const response: Response = await testApiClient.post('/external');

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when the external system returns an error', () => {
				beforeAll(async () => {
					const config: ServerConfig = serverConfig();
					config.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = true;
					await setupTestWithMocks(false);
				});

				const setup = async () => {
					const user = userFactory.build();
					user.id = mockedUserId;
					const sessionToken = oauthSessionTokenEntityFactory.buildWithId({
						user,
					});

					const system = systemEntityFactory.withOauthConfig().build({ alias: 'SANIS' });
					system.id = mockedSystemId;

					await em.persistAndFlush([user, system, sessionToken]);
					em.clear();
				};

				it('should return status 500', async () => {
					await setup();

					const response: Response = await testApiClient.post('/external');

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});

			describe('when no oauth config can be found for the system', () => {
				beforeAll(async () => {
					const config: ServerConfig = serverConfig();
					config.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = true;
					await setupTestWithMocks();
				});

				const setup = async () => {
					const user = userFactory.build();
					user.id = mockedUserId;
					const sessionToken = oauthSessionTokenEntityFactory.buildWithId({
						user,
					});

					const system = systemEntityFactory.build({ alias: 'SANIS' });
					system.id = mockedSystemId;

					await em.persistAndFlush([user, system, sessionToken]);
					em.clear();
				};

				it('should return status 500', async () => {
					await setup();

					const response: Response = await testApiClient.post('/external');

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});

			describe('when the oauth config has no end session endpoint', () => {
				beforeAll(async () => {
					const config: ServerConfig = serverConfig();
					config.FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED = true;
					await setupTestWithMocks();
				});

				const setup = async () => {
					const user = userFactory.build();
					user.id = mockedUserId;
					const sessionToken = oauthSessionTokenEntityFactory.buildWithId({
						user,
					});

					const system = systemEntityFactory.withOauthConfig().build({ alias: 'SANIS' });
					system.id = mockedSystemId;
					const oauthConfig = system.oauthConfig as OauthConfig;
					oauthConfig.endSessionEndpoint = undefined;

					await em.persistAndFlush([user, system, sessionToken]);
					em.clear();
				};

				it('should return status 500', async () => {
					await setup();

					const response: Response = await testApiClient.post('/external');

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
				});
			});
		});
	});
});

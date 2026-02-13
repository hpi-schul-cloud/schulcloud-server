import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '@modules/authentication/authentication-config';
import { OauthSessionTokenEntity } from '@modules/oauth/entity';
import { oauthSessionTokenEntityFactory } from '@modules/oauth/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { systemEntityFactory, systemOauthConfigEntityFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Request } from 'express';
import { Response } from 'supertest';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'RS256',
			getPublicKey: jest.fn().mockReturnValue(JwtTestFactory.getPublicKey()),
			rsaPublicKey: JwtTestFactory.getPublicKey(),
		}),
		getSigningKeys: jest.fn(),
	};
});

describe('Logout Controller (api)', () => {
	const baseRouteName = '/logout';

	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let axiosMock: MockAdapter;
	let config: AuthenticationConfig;

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
		config = app.get<AuthenticationConfig>(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('logout', () => {
		describe('when a valid jwt is provided', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return {
					loggedInClient,
					studentAccount,
				};
			};

			it('should log out the user', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('');

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when the user is not logged in', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.post('');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('logoutOidc', () => {
		describe('when a valid logout token is provided', () => {
			const setup = async () => {
				const userExternalId = 'userExternalId';

				const oauthConfigEntity = systemOauthConfigEntityFactory.build();
				const system = systemEntityFactory.withOauthConfig(oauthConfigEntity).buildWithId();

				const school = schoolEntityFactory.buildWithId({ systems: [system] });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					school,
					externalId: userExternalId,
					systemId: system.id,
				});

				await em.persist([system, school, studentAccount, studentUser]).flush();
				em.clear();

				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: userExternalId,
					iss: oauthConfigEntity.issuer,
					aud: oauthConfigEntity.clientId,
				});

				return {
					system,
					logoutToken,
					studentAccount,
				};
			};

			it('should log out the user', async () => {
				const { logoutToken } = await setup();

				const response: Response = await testApiClient.post('/oidc', { logout_token: logoutToken });

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});

	describe('externalSystemLogout', () => {
		let currentUser: ICurrentUser;

		const setupTestWithMocks = async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerTestModule],
			})
				.overrideGuard(JwtAuthGuard)
				.useValue({
					canActivate(context: ExecutionContext) {
						const req: Request = context.switchToHttp().getRequest();
						req.user = currentUser;
						return true;
					},
				})
				.compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			em = app.get(EntityManager);
			testApiClient = new TestApiClient(app, baseRouteName);
			axiosMock = new MockAdapter(axios);
			config = app.get<AuthenticationConfig>(AUTHENTICATION_CONFIG_TOKEN);
		};

		describe('when the user is not logged in', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.post('/external');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature flag "FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED" is false', () => {
			beforeAll(async () => {
				await setupTestWithMocks();
				config.externalSystemLogoutEnabled = false;
			});

			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const system = systemEntityFactory.withOauthConfig().build();
				const token = oauthSessionTokenEntityFactory.build({ user: studentUser });

				await em.persist([studentAccount, studentUser, system, token]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				currentUser = currentUserFactory.build({
					userId: studentUser.id,
					accountId: studentAccount.id,
					systemId: system.id,
					isExternalUser: true,
				});

				axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

				return {
					loggedInClient,
				};
			};

			it('should return status 403', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/external');

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the feature flag "FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED" is true', () => {
			beforeAll(async () => {
				await setupTestWithMocks();
				config.externalSystemLogoutEnabled = true;
			});

			describe('when the external system does not return an error', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const system = systemEntityFactory.withOauthConfig().build();
					const token = oauthSessionTokenEntityFactory.build({ user: studentUser });

					await em.persist([studentAccount, studentUser, system, token]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

					return {
						loggedInClient,
						user: studentUser,
					};
				};

				it('should return status 200 and remove the session token', async () => {
					const { loggedInClient, user } = await setup();

					const response: Response = await loggedInClient.post('/external');
					const token = await em.findOne(OauthSessionTokenEntity, { user });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(token).toBeNull();
				});
			});

			describe('when the external system returns an error', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const system = systemEntityFactory.withOauthConfig().build();
					const token = oauthSessionTokenEntityFactory.build({ user: studentUser });

					await em.persist([studentAccount, studentUser, system, token]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.BAD_REQUEST);

					return {
						loggedInClient,
						user: studentUser,
					};
				};

				it('should return status 500', async () => {
					const { loggedInClient, user } = await setup();

					const response: Response = await loggedInClient.post('/external');
					const token = await em.findOne(OauthSessionTokenEntity, { user });

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
					expect(token).not.toBeNull();
				});
			});

			describe('when no oauth config can be found for the system', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const system = systemEntityFactory.build();
					const token = oauthSessionTokenEntityFactory.build({ user: studentUser });

					await em.persist([studentAccount, studentUser, system, token]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

					return {
						loggedInClient,
						user: studentUser,
					};
				};

				it('should return status 500', async () => {
					const { loggedInClient, user } = await setup();

					const response: Response = await loggedInClient.post('/external');

					const token = await em.findOne(OauthSessionTokenEntity, { user });

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
					expect(token).not.toBeNull();
				});
			});

			describe('when the oauth config has no end session endpoint', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const oauthConfig = systemOauthConfigFactory.build({ endSessionEndpoint: undefined });
					const system = systemEntityFactory.withOauthConfig().build({ oauthConfig });
					const token = oauthSessionTokenEntityFactory.build({ user: studentUser });

					await em.persist([studentAccount, studentUser, system, token]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

					return {
						loggedInClient,
						user: studentUser,
					};
				};

				it('should return status 500', async () => {
					const { loggedInClient, user } = await setup();

					const response: Response = await loggedInClient.post('/external');
					const token = await em.findOne(OauthSessionTokenEntity, { user });

					expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
					expect(token).not.toBeNull();
				});
			});

			describe('when the session token of the user is deleted or could not be found', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const oauthConfig = systemOauthConfigFactory.build();
					const system = systemEntityFactory.withOauthConfig().build({ oauthConfig });

					await em.persist([studentAccount, studentUser, system]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

					return {
						loggedInClient,
					};
				};

				it('should return status 200', async () => {
					const { loggedInClient } = await setup();

					const response: Response = await loggedInClient.post('/external');

					expect(response.status).toEqual(HttpStatus.OK);
				});
			});

			describe('when the session token of the user is expired', () => {
				const setup = async () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const oauthConfig = systemOauthConfigFactory.build();
					const system = systemEntityFactory.withOauthConfig().build({ oauthConfig });
					const token = oauthSessionTokenEntityFactory.build({ expiresAt: new Date(Date.now() - 5000) });

					await em.persist([studentAccount, studentUser, system, token]).flush();
					em.clear();

					const loggedInClient = await testApiClient.login(studentAccount);

					currentUser = currentUserFactory.build({
						userId: studentUser.id,
						accountId: studentAccount.id,
						systemId: system.id,
						isExternalUser: true,
					});

					axiosMock.onPost(system.oauthConfig?.endSessionEndpoint).reply(HttpStatus.NO_CONTENT);

					return {
						loggedInClient,
						user: studentUser,
					};
				};

				it('should return status 200 and remove the expired token', async () => {
					const { loggedInClient, user } = await setup();

					const response: Response = await loggedInClient.post('/external');
					const token = await em.findOne(OauthSessionTokenEntity, { user });

					expect(response.status).toEqual(HttpStatus.OK);
					expect(token).toBeNull();
				});
			});
		});
	});
});

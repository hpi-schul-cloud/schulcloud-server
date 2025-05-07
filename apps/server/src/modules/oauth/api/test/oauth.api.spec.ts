import { EntityManager } from '@mikro-orm/mongodb';
import { oauthSessionTokenEntityFactory } from '@modules/oauth/testing';
import { ServerTestModule } from '@modules/server';
import { systemEntityFactory } from '@modules/system/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { UUID } from 'bson';

describe('OAuth Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);

		testApiClient = new TestApiClient(app, 'oauth');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /session-token/expiration', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get('/session-token/expiration');

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has an oauth session token saved', () => {
			const setup = async () => {
				const system = systemEntityFactory.withOauthConfig().build();

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					externalId: new UUID().toString(),
					systemId: system.id,
				});

				const sessionToken = oauthSessionTokenEntityFactory.build({ system, user: studentUser });

				await em.persistAndFlush([studentAccount, studentUser, system, sessionToken]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, sessionToken };
			};

			it('should return a response containing the expiration of the token', async () => {
				const { loggedInClient, sessionToken } = await setup();

				const response = await loggedInClient.get('/session-token/expiration').send();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({ expiresAt: sessionToken.expiresAt.toISOString() });
			});
		});

		describe('when the user has multiple oauth session tokens saved', () => {
			const setup = async () => {
				const system = systemEntityFactory.withOauthConfig().build();

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					externalId: new UUID().toString(),
					systemId: system.id,
				});

				const latestSessionToken = oauthSessionTokenEntityFactory.build({ system, user: studentUser });
				const olderSessionToken = oauthSessionTokenEntityFactory.build({
					system,
					user: studentUser,
					expiresAt: new Date(latestSessionToken.expiresAt.getTime() - 3600 * 1000),
				});

				await em.persistAndFlush([studentAccount, studentUser, system, latestSessionToken, olderSessionToken]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, latestSessionToken };
			};

			it('should return a response containing the expiration of the latest token', async () => {
				const { loggedInClient, latestSessionToken } = await setup();

				const response = await loggedInClient.get('/session-token/expiration').send();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({ expiresAt: latestSessionToken.expiresAt.toISOString() });
			});
		});

		describe('when the user has no oauth session token saved', () => {
			const setup = async () => {
				const system = systemEntityFactory.withOauthConfig().build();

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					externalId: new UUID().toString(),
					systemId: system.id,
				});

				await em.persistAndFlush([studentAccount, studentUser, system]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a response with not found status', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('/session-token/expiration').send();

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});
	});
});

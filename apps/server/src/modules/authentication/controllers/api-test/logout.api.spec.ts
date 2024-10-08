import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Cache } from 'cache-manager';
import { Response } from 'supertest';

describe('Logout Controller (api)', () => {
	const baseRouteName = '/logout';

	let app: INestApplication;
	let em: EntityManager;
	let cacheManager: Cache;
	let testApiClient: TestApiClient;

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

	afterAll(async () => {
		await app.close();
	});

	describe('logout', () => {
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

				const response: Response = await loggedInClient.delete('');

				expect(response.status).toEqual(HttpStatus.OK);
				expect(await cacheManager.store.keys(`jwt:${studentAccount.id}:*`)).toHaveLength(0);
			});
		});

		describe('when the user is not logged in', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.delete('');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});

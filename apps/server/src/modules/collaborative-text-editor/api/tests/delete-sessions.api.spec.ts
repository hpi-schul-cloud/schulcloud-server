import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { EtherpadClientAdapter } from '@src/infra/etherpad-client';
import { ServerTestModule } from '@src/modules/server';

describe('Collaborative Text Editor Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let etherpadClientAdapter: DeepMocked<EtherpadClientAdapter>;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(EtherpadClientAdapter)
			.useValue(createMock<EtherpadClientAdapter>())
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'collaborative-text-editor');
		etherpadClientAdapter = module.get(EtherpadClientAdapter);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('delete sessions by user', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const response = await testApiClient.delete(`delete-sessions`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const authorId = 'authorId';
				etherpadClientAdapter.getOrCreateAuthorId.mockResolvedValueOnce(authorId);

				const otherSessionIds = ['otherSessionId1', 'otherSessionId2'];
				etherpadClientAdapter.listSessionIdsOfAuthor.mockResolvedValueOnce(otherSessionIds);

				etherpadClientAdapter.deleteSession.mockResolvedValueOnce();
				etherpadClientAdapter.deleteSession.mockResolvedValueOnce();

				return {
					loggedInClient,
				};
			};

			it('should resolve successfully', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.delete(`delete-sessions`);
			});
		});
	});
});

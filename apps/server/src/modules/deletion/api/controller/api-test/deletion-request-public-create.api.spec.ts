import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { AccountEntity } from '@modules/account/repo';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { DeletionRequestParams } from '../dto';

const baseRouteName = '/deletionRequestsPublic';

describe(`deletionRequest public create (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('createDeletionRequestPublic', () => {
		const setup = async () => {
			const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

			const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

			await em.persist([studentUser, studentAccount, adminAccount, adminUser]).flush();
			em.clear();

			const deletionRequestToCreate: DeletionRequestParams = {
				ids: [studentUser.id],
			};
			const queryString = deletionRequestToCreate.ids.map((id) => `ids[]=${id}`).join('&');
			const nonexistentId = new ObjectId().toString();
			const loggedInClient = await testApiClient.login(adminAccount);

			return {
				nonexistentId,
				studentUser,
				queryString,
				loggedInClient,
			};
		};

		it('should return status 204', async () => {
			const { queryString, loggedInClient } = await setup();

			const response = await loggedInClient.delete(`?${queryString}`);

			expect(response.status).toEqual(204);
		});

		it('should actually create a deletion request', async () => {
			const { studentUser, queryString, loggedInClient } = await setup();

			await loggedInClient.delete(`?${queryString}`);

			const deletionRequest = await em.findOne('DeletionRequestEntity', { targetRefId: new ObjectId(studentUser.id) });
			expect(deletionRequest).toBeDefined();
		});

		it('should deactivate the user account', async () => {
			const { studentUser, queryString, loggedInClient } = await setup();

			await loggedInClient.delete(`?${queryString}`);

			const account = await em.findOne(AccountEntity, { userId: new ObjectId(studentUser.id) });
			expect(account?.deactivatedAt).toBeDefined();
		});

		it('should return status 400 when all deletion requests fail', async () => {
			const { loggedInClient, nonexistentId } = await setup();

			const response = await loggedInClient.delete(`?ids[]=${nonexistentId}`);

			expect(response.status).toEqual(400);
		});

		it('should return status 207 when some deletion requests fail', async () => {
			const { nonexistentId, queryString, loggedInClient } = await setup();

			const response = await loggedInClient.delete(`?${queryString}&ids[]=${nonexistentId}`);

			expect(response.status).toEqual(207);
		});

		it('should not allow more than 10 deletion requests to be created', async () => {
			const { studentUser, loggedInClient, queryString } = await setup();

			let additionalQueryString = '';
			for (let i = 0; i < 10; i++) {
				additionalQueryString += `&ids[]=${new ObjectId().toString()}`;
			}

			const response = await loggedInClient.delete(`?${queryString}${additionalQueryString}`);

			expect(response.status).toEqual(400);
			const deletionRequest = await em.findOne('DeletionRequestEntity', { targetRefId: new ObjectId(studentUser.id) });
			expect(deletionRequest).toBeDefined();
		});
	});
});

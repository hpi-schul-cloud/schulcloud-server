import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';

jest.setTimeout(60_000);

describe('Admin API - Accounts', () => {
	const basePath = '/admin/accounts';
	let app: INestApplication;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	const client = () => new TestApiClientBuilder(app, basePath).withApiKey('someotherkey').build();

	it('rejects requests without the Admin API key', async () => {
		const response = await new TestApiClientBuilder(app, basePath).withApiKey('').build().get('');
		expect(response.status).toBe(401);
	});

	it('searches, reads, updates, and deletes accounts', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
		await em.persist([school, studentUser, studentAccount]).flush();

		const api = client();
		const search = await api.get(`?type=userId&value=${studentUser.id}`);
		expect(search.status).toBe(200);
		const searchBody = search.body as unknown as { data: Array<{ id: string; userId: string }> };
		expect(searchBody.data).toEqual([expect.objectContaining({ id: studentAccount.id, userId: studentUser.id })]);

		const detail = await api.get(`/${studentAccount.id}`);
		expect(detail.status).toBe(200);
		expect(detail.body).toEqual(expect.objectContaining({ id: studentAccount.id, username: studentAccount.username }));

		const update = await api.patch(`/${studentAccount.id}`, { activated: false });
		expect(update.status).toBe(200);
		const updateBody = update.body as unknown as { activated: boolean };
		expect(updateBody.activated).toBe(false);

		const deletion = await api.delete(`/${studentAccount.id}`);
		expect(deletion.status).toBe(200);
		await expect(em.findOne(AccountEntity, { id: studentAccount.id })).resolves.toBeNull();
	});
});

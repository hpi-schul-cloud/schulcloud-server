import { EntityManager } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';

jest.setTimeout(60_000);

describe('Admin API - Support JWT', () => {
	const basePath = '/admin/authentication';
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

	it('requires the Admin API key', async () => {
		const response = await new TestApiClientBuilder(app, basePath)
			.withApiKey('thisisaninvalidapikey')
			.build()
			.post('/support-jwt', { userId: '000000000000000000000000', supportUserId: '000000000000000000000001' });
		expect(response.status).toBe(401);
	});

	it('creates a support JWT after checking the identified support user permissions', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school }, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
		await em.persist([school, superheroUser, superheroAccount, studentUser, studentAccount]).flush();

		const response = await new TestApiClientBuilder(app, basePath)
			.withApiKey('someotherkey')
			.build()
			.post('/support-jwt', { userId: studentUser.id, supportUserId: superheroUser.id });

		expect(response.status).toBe(201);
		expect(response.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
	});
});

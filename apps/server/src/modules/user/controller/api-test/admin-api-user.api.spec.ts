import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { schoolEntityFactory, TestApiClient, TestXApiKeyClient } from '@shared/testing';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.module';
import { nanoid } from 'nanoid';
import { AdminApiUserCreateResponse } from '../dto/admin-api-user-create.response.dto';

const baseRouteName = '/admin/users';

describe('Admin API - Users (API)', () => {
	let app: INestApplication;
	let testXApiKeyClient: TestXApiKeyClient;
	let testApiClient: TestApiClient;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create user with account', () => {
		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestXApiKeyClient(app, baseRouteName, 'thisisaninvalidapikey');
				const response = await client.post('');
				expect(response.status).toEqual(401);
			});
			it('should refuse without token', async () => {
				const response = await testApiClient.post('');
				expect(response.status).toEqual(401);
			});
		});

		describe('with api token', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				await em.persistAndFlush(school);

				const schoolId = school.id;
				const firstName = 'firstname';
				const lastName = 'lastName';
				const email = `mail${nanoid(12)}@domain.de`;
				const roleNames = [RoleName.STUDENT];

				const body = { schoolId, firstName, lastName, email, roleNames };

				return { body };
			};

			it('should return 201', async () => {
				const { body } = await setup();
				const response = await testXApiKeyClient.post('', body);

				expect(response.status).toEqual(201);
			});

			it('should persist user', async () => {
				const { body } = await setup();
				const response = await testXApiKeyClient.post('', body);
				const { userId } = response.body as AdminApiUserCreateResponse;

				const loaded = await em.findOneOrFail(User, userId);
				expect(loaded).toEqual(
					expect.objectContaining({
						id: userId,
						firstName: body.firstName,
						lastName: body.lastName,
						email: body.email,
					})
				);
			});

			it('should persist account', async () => {
				const { body } = await setup();
				const response = await testXApiKeyClient.post('', body);
				const { accountId } = response.body as AdminApiUserCreateResponse;

				const loaded = await em.findOneOrFail(Account, accountId);
				expect(loaded).toEqual(
					expect.objectContaining({
						id: accountId,
						username: body.email,
					})
				);
			});
		});
	});
});

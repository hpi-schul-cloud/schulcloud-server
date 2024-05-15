import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { TestApiClient, schoolEntityFactory } from '@shared/testing/factory';
import { AccountEntity } from '@modules/account/entity/account.entity';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.module';
import { nanoid } from 'nanoid';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiUserCreateResponse } from '../dto/admin-api-user-create.response.dto';

const baseRouteName = '/admin/users';

describe('Admin API - Users (API)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideGuard(AuthGuard('api-key'))
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					return req.headers['x-api-key'] === API_KEY;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create user with account', () => {
		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);
				const response = await client.post('');
				expect(response.status).toEqual(403);
			});
			it('should refuse without token', async () => {
				const client = new TestApiClient(app, baseRouteName, '', true);
				const response = await client.post('');
				expect(response.status).toEqual(403);
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
				const response = await testApiClient.post('', body);

				expect(response.status).toEqual(201);
			});

			it('should persist user', async () => {
				const { body } = await setup();
				const response = await testApiClient.post('', body);
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
				const response = await testApiClient.post('', body);
				const { accountId } = response.body as AdminApiUserCreateResponse;

				const loaded = await em.findOneOrFail(AccountEntity, accountId);
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

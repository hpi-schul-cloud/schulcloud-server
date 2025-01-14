import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ServerTestModule } from '@modules/server/server.module';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';

const baseRouteName = '/user';

describe(baseRouteName, () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with user is not logged in', () => {
		it('should return status 401', async () => {
			const response = await apiClient.get('/me');

			expect(response.status).toEqual(401);
		});
	});

	describe('without valid request data', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

			await em.persistAndFlush([teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);

			return { loggedInClient, teacherUser };
		};

		it('should return status 200 for successful request.', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.get('/me');

			expect(response.statusCode).toEqual(200);
		});

		it('should return ResolvedUserResponse.', async () => {
			const { loggedInClient, teacherUser } = await setup();

			const response = await loggedInClient.get('/me');

			expect(response.body).toMatchObject({
				id: teacherUser.id,
				firstName: teacherUser.firstName,
				lastName: teacherUser.lastName,
				permissions: teacherUser.resolvePermissions(),
				schoolId: teacherUser.school.id,
			});
		});
	});
});

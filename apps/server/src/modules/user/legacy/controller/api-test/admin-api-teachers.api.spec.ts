import { EntityManager } from '@mikro-orm/core';
import { accountFactory } from '@modules/account/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../dto';

describe('Users Admin Teachers Controller (API)', () => {
	const basePath = '/users/admin/teachers';

	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	let teacherUser1: User;
	let teacherUser2: User;
	let loggedInAdminClient: TestApiClient;
	let loggedInTeacherClient: TestApiClient;

	const setup = async () => {
		const currentYear = schoolYearEntityFactory.withStartYear(2002).buildWithId();
		const school = schoolEntityFactory.buildWithId({ currentYear });

		const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

		const teacherRole = roleFactory.buildWithId({ name: RoleName.TEACHER, permissions: [] });
		teacherUser1 = userFactory.withRole(teacherRole).buildWithId({ school });
		const teacherAccount1 = accountFactory.withUser(teacherUser1).build();

		teacherUser2 = userFactory.withRole(teacherRole).buildWithId({ school });

		await em.persistAndFlush([
			currentYear,
			school,
			adminAccount,
			adminUser,
			teacherUser1,
			teacherAccount1,
			teacherUser2,
		]);
		em.clear();

		loggedInAdminClient = await apiClient.login(adminAccount);
		loggedInTeacherClient = await apiClient.login(teacherAccount1);

		return {
			adminUser,
			adminAccount,
			teacherUser1,
			teacherAccount1,
			teacherUser2,
			loggedInAdminClient,
			loggedInTeacherClient,
		};
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		apiClient = new TestApiClient(app, basePath);

		await setup();
	});

	afterAll(async () => {
		await app.close();
		em.clear();
	});

	describe('[GET] :id', () => {
		describe('when teacher exists', () => {
			it('should return teacher ', async () => {
				const response = await loggedInAdminClient.get(teacherUser1.id).expect(200);

				// eslint-disable-next-line @typescript-eslint/naming-convention
				const { _id } = response.body as UserResponse;

				expect(_id).toBe(teacherUser1._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			it('should reject request', async () => {
				const response = await loggedInTeacherClient.get(teacherUser1.id);

				expect(response.status).toBe(403);
			});
		});

		describe('when teacher does not exists', () => {
			it('should reject request ', async () => {
				const response = await loggedInAdminClient.get('000000000000000000000000');

				expect(response.status).toBe(404);
			});
		});
	});

	describe('[GET]', () => {
		describe('when sort param is provided', () => {
			it('should return teachers in correct order', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				const response = await loggedInAdminClient.get('').query(query).set('Accept', 'application/json').expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
				expect(data[0]._id).toBe(teacherUser1._id.toString());
				expect(data[1]._id).toBe(teacherUser2._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			it('should reject request', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				await loggedInTeacherClient.get('').query(query).send().expect(403);
			});
		});
	});
});

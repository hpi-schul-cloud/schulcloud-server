import { EntityManager } from '@mikro-orm/mongodb';
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

describe('Users Admin Students Controller (API)', () => {
	const basePath = '/users/admin/students';

	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	let studentUser1: User;
	let studentUser2: User;
	let loggedInAdminClient: TestApiClient;
	let loggedInStudentClient: TestApiClient;

	const setup = async () => {
		const currentYear = schoolYearEntityFactory.withStartYear(2002).buildWithId();
		const school = schoolEntityFactory.buildWithId({ currentYear });
		const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT, permissions: [] });

		const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
		studentUser1 = userFactory.withRole(studentRole).buildWithId({ school });

		const studentAccount1 = accountFactory.withUser(studentUser1).build();
		studentUser2 = userFactory.withRole(studentRole).buildWithId({ school });

		await em.persistAndFlush([
			studentRole,
			school,
			currentYear,
			adminAccount,
			adminUser,
			studentUser1,
			studentAccount1,
			studentUser2,
		]);
		em.clear();

		loggedInAdminClient = await apiClient.login(adminAccount);
		loggedInStudentClient = await apiClient.login(studentAccount1);

		return {
			adminUser,
			adminAccount,
			studentUser1,
			studentAccount1,
			studentUser2,
			loggedInAdminClient,
			loggedInStudentClient,
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
		describe('when student exists', () => {
			it('should return student ', async () => {
				const response = await loggedInAdminClient.get(studentUser1.id).expect(200);

				// eslint-disable-next-line @typescript-eslint/naming-convention
				const { _id } = response.body as UserResponse;

				expect(_id).toBe(studentUser1._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			it('should reject request', async () => {
				await loggedInStudentClient.get(studentUser1.id).expect(403);
			});
		});

		describe('when student does not exists', () => {
			it('should reject request ', async () => {
				await loggedInAdminClient.get(`000000000000000000000000`).expect(404);
			});
		});
	});

	describe('[GET]', () => {
		describe('when sort param is provided', () => {
			it('should return students in correct order', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};
				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
				expect(data[0]._id).toBe(studentUser1._id.toString());
				expect(data[1]._id).toBe(studentUser2._id.toString());
			});
		});

		describe('when sorting by classes', () => {
			it('should return students', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { classes: 1 },
				};

				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
			});
		});

		describe('when sorting by consentStatus', () => {
			it('should return students', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { consentStatus: 1 },
				};
				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
			});
		});

		describe('when searching for users by wrong params', () => {
			it('should return empty list', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
					classes: ['1A'],
				};
				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(0);
				expect(data.length).toBe(0);
			});
		});

		describe('when user has no right permission', () => {
			it('should reject request', async () => {
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				await loggedInStudentClient.get().query(query).send().expect(403);
			});
		});

		describe('when date range filters are provided', () => {
			it('should accept and process date range parameters for createdAt, lastLoginSystemChange, and outdatedSince', async () => {
				const now = new Date();
				const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

				const query = {
					$skip: 0,
					$limit: 5,
					createdAt: {
						$gte: yesterday,
						$lte: tomorrow,
					},
					lastLoginSystemChange: {
						$gt: yesterday,
						$lt: tomorrow,
					},
					outdatedSince: {
						$gt: yesterday,
						$lt: tomorrow,
					},
				};

				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBeGreaterThanOrEqual(0);
				expect(Array.isArray(data)).toBe(true);
			});

			it('should filter users by createdAt date range and return matching results', async () => {
				const query = {
					$skip: 0,
					$limit: 10,
					createdAt: {
						$gte: studentUser1.createdAt,
						$lte: new Date(),
					},
				};

				const response = await loggedInAdminClient.get().query(query).expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBeGreaterThan(0);
				expect(data.some((user) => user._id === studentUser1.id)).toBe(true);
			});
		});
	});
});

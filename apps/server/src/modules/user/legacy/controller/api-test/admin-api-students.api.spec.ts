import { EntityManager } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	accountFactory,
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	schoolYearFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '@modules/user/legacy/controller/dto';

describe('Users Admin Students Controller (API)', () => {
	const basePath = '/users/admin/students';

	let app: INestApplication;
	let em: EntityManager;

	let adminAccount: Account;
	let studentAccount1: Account;
	let studentAccount2: Account;

	let adminUser: User;
	let studentUser1: User;
	let studentUser2: User;

	let currentUser: ICurrentUser;

	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setupDb = async () => {
		const currentYear = schoolYearFactory.withStartYear(2002).buildWithId();
		const school = schoolEntityFactory.buildWithId({ currentYear });

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.STUDENT_LIST],
		});
		const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		studentUser1 = userFactory.buildWithId({
			firstName: 'Marla',
			school,
			roles: [studentRoles],
			consent: {},
		});

		studentUser2 = userFactory.buildWithId({
			firstName: 'Test',
			school,
			roles: [studentRoles],
			consent: {},
		});

		const mapUserToAccount = (user: User): Account =>
			accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
			});
		adminAccount = mapUserToAccount(adminUser);
		studentAccount1 = mapUserToAccount(studentUser1);
		studentAccount2 = mapUserToAccount(studentUser2);

		em.persist(school);
		em.persist(currentYear);
		em.persist([adminRoles, studentRoles]);
		em.persist([adminUser, studentUser1, studentUser2]);
		em.persist([adminAccount, studentAccount1, studentAccount2]);
		await em.flush();
	};

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	beforeEach(async () => {
		await setupDb();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] :id', () => {
		describe('when student exists', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			};

			it('should return student ', async () => {
				setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}/${studentUser1.id}`)
					.expect(200);

				// eslint-disable-next-line @typescript-eslint/naming-convention
				const { _id } = response.body as UserResponse;

				expect(_id).toBe(studentUser1._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(studentUser1, studentAccount1);
			};

			it('should reject request', async () => {
				setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}/${studentUser1.id}`)
					.expect(403);
			});
		});

		describe('when student does not exists', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			};

			it('should reject request ', async () => {
				setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}/000000000000000000000000`)
					.expect(404);
			});
		});
	});

	describe('[GET]', () => {
		describe('when sort param is provided', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				return {
					query,
				};
			};

			it('should return students in correct order', async () => {
				const { query } = setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
				expect(data[0]._id).toBe(studentUser1._id.toString());
				expect(data[1]._id).toBe(studentUser2._id.toString());
			});
		});

		describe('when search params are too tight', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
					classes: ['1A'],
					consentStatus: { $in: ['ok'] },
					searchQuery: 'test',
					createdAt: {
						$gt: new Date('2024-02-08T23:00:00Z'),
						$gte: new Date('2024-02-08T23:00:00Z'),
						$lt: new Date('2024-02-08T23:00:00Z'),
						$lte: new Date('2024-02-08T23:00:00Z'),
					},
					lastLoginSystemChange: {
						$gt: new Date('2024-02-08T23:00:00Z'),
						$gte: new Date('2024-02-08T23:00:00Z'),
						$lt: new Date('2024-02-08T23:00:00Z'),
						$lte: new Date('2024-02-08T23:00:00Z'),
					},
					outdatedSince: {
						$gt: new Date('2024-02-08T23:00:00Z'),
						$gte: new Date('2024-02-08T23:00:00Z'),
						$lt: new Date('2024-02-08T23:00:00Z'),
						$lte: new Date('2024-02-08T23:00:00Z'),
					},
				};

				return {
					query,
				};
			};

			it('should return empty list', async () => {
				const { query } = setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.send()
					.expect(200);
				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(0);
				expect(data.length).toBe(0);
			});
		});

		describe('when skip params are too big', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
				const query: UsersSearchQueryParams = {
					$skip: 50000,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				return {
					query,
				};
			};

			it('should return empty list', async () => {
				const { query } = setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.send()
					.expect(200);
				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(0);
				expect(data.length).toBe(0);
			});
		});

		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(studentUser1, studentAccount1);
				const query: UsersSearchQueryParams = {
					$skip: 0,
					$limit: 5,
					$sort: { firstName: 1 },
				};

				return {
					query,
				};
			};

			it('should reject request', async () => {
				const { query } = setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.send()
					.expect(403);
			});
		});
	});
});
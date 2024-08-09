import { ICurrentUser } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import {
	mapUserToCurrentUser,
	roleFactory,
	schoolEntityFactory,
	schoolYearFactory,
	userFactory,
} from '@shared/testing';
import { JwtAuthGuard } from '@src/infra/auth-guard/guard/jwt-auth.guard';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { accountFactory } from '@src/modules/account/testing';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';
import { UserListResponse, UserResponse, UsersSearchQueryParams } from '../dto';

describe('Users Admin Teachers Controller (API)', () => {
	const basePath = '/users/admin/teachers';

	let app: INestApplication;
	let em: EntityManager;

	let adminAccount: AccountEntity;
	let teacherAccount1: AccountEntity;
	let teacherAccount2: AccountEntity;

	let adminUser: User;
	let teacherUser1: User;
	let teacherUser2: User;

	let currentUser: ICurrentUser;

	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setupDb = async () => {
		const currentYear = schoolYearFactory.withStartYear(2002).buildWithId();
		const school = schoolEntityFactory.buildWithId({ currentYear });

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.TEACHER_LIST],
		});
		const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		teacherUser1 = userFactory.buildWithId({
			firstName: 'Marla',
			school,
			roles: [teacherRoles],
			consent: {},
		});

		teacherUser2 = userFactory.buildWithId({
			firstName: 'Test',
			school,
			roles: [teacherRoles],
			consent: {},
		});

		const mapUserToAccount = (user: User): AccountEntity =>
			accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
			});
		adminAccount = mapUserToAccount(adminUser);
		teacherAccount1 = mapUserToAccount(teacherUser1);
		teacherAccount2 = mapUserToAccount(teacherUser2);

		em.persist(school);
		em.persist(currentYear);
		em.persist([adminRoles, teacherRoles]);
		em.persist([adminUser, teacherUser1, teacherUser2]);
		em.persist([adminAccount, teacherAccount1, teacherAccount2]);
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

		await setupDb();
	});

	afterAll(async () => {
		await app.close();
		em.clear();
	});

	describe('[GET] :id', () => {
		describe('when teacher exists', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			};

			it('should return teacher ', async () => {
				setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}/${teacherUser1.id}`)
					.expect(200);

				// eslint-disable-next-line @typescript-eslint/naming-convention
				const { _id } = response.body as UserResponse;

				expect(_id).toBe(teacherUser1._id.toString());
			});
		});

		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(teacherUser1, teacherAccount1);
			};

			it('should reject request', async () => {
				setup();
				await request(app.getHttpServer()) //
					.get(`${basePath}/${teacherUser1.id}`)
					.expect(403);
			});
		});

		describe('when teacher does not exists', () => {
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

			it('should return teachers in correct order', async () => {
				const { query } = setup();
				const response = await request(app.getHttpServer()) //
					.get(`${basePath}`)
					.query(query)
					.set('Accept', 'application/json')
					.expect(200);

				const { data, total } = response.body as UserListResponse;

				expect(total).toBe(2);
				expect(data.length).toBe(2);
				expect(data[0]._id).toBe(teacherUser1._id.toString());
				expect(data[1]._id).toBe(teacherUser2._id.toString());
			});
		});
		describe('when user has no right permission', () => {
			const setup = () => {
				currentUser = mapUserToCurrentUser(teacherUser1, teacherAccount1);
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

import { EntityManager } from '@mikro-orm/core';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { accountFactory, mapUserToCurrentUser, roleFactory, schoolEntityFactory, userFactory } from '@shared/testing';
import {
	AccountByIdBodyParams,
	AccountSearchQueryParams,
	AccountSearchType,
	PatchMyAccountParams,
	PatchMyPasswordParams,
} from '@src/modules/account/controller/dto';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server/server.module';
import { Request } from 'express';
import request from 'supertest';

describe('Account Controller (API)', () => {
	const basePath = '/account';

	let app: INestApplication;
	let em: EntityManager;

	let adminAccount: Account;
	let teacherAccount: Account;
	let studentAccount: Account;
	let superheroAccount: Account;

	let adminUser: User;
	let teacherUser: User;
	let studentUser: User;
	let superheroUser: User;

	let currentUser: ICurrentUser;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setup = async () => {
		const school = schoolEntityFactory.buildWithId();

		const adminRoles = roleFactory.build({
			name: RoleName.ADMINISTRATOR,
			permissions: [Permission.TEACHER_EDIT, Permission.STUDENT_EDIT],
		});
		const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] });
		const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
		const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

		adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
		studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
		superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

		const mapUserToAccount = (user: User): Account =>
			accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
			});
		adminAccount = mapUserToAccount(adminUser);
		teacherAccount = mapUserToAccount(teacherUser);
		studentAccount = mapUserToAccount(studentUser);
		superheroAccount = mapUserToAccount(superheroUser);

		em.persist(school);
		em.persist([adminRoles, teacherRoles, studentRoles, superheroRoles]);
		em.persist([adminUser, teacherUser, studentUser, superheroUser]);
		em.persist([adminAccount, teacherAccount, studentAccount, superheroAccount]);
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
		await setup();
	});

	afterAll(async () => {
		// await cleanupCollections(em);
		await app.close();
	});

	describe('[PATCH] me/password', () => {
		it(`should update the current user's (temporary) password`, async () => {
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const params: PatchMyPasswordParams = {
				password: 'Valid12$',
				confirmPassword: 'Valid12$',
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/me/password`)
				.send(params)
				.expect(200);

			const updatedAccount = await em.findOneOrFail(Account, studentAccount.id);
			expect(updatedAccount.password).not.toEqual(defaultPasswordHash);
		});
		it('should reject if new password is weak', async () => {
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const params: PatchMyPasswordParams = {
				password: 'weak',
				confirmPassword: 'weak',
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/me/password`)
				.send(params)
				.expect(400);
		});
	});

	describe('[PATCH] me', () => {
		it(`should update a users account`, async () => {
			const newEmailValue = 'new@mail.com';
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const params: PatchMyAccountParams = {
				passwordOld: defaultPassword,
				email: newEmailValue,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/me`)
				.send(params)
				.expect(200);
			const updatedAccount = await em.findOneOrFail(Account, studentAccount.id);
			expect(updatedAccount.username).toEqual(newEmailValue);
		});

		it('should reject if new email is not valid', async () => {
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const params: PatchMyAccountParams = {
				passwordOld: defaultPassword,
				email: 'invalid',
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/me`)
				.send(params)
				.expect(400);
		});

		it('should strip HTML off of firstName and lastName', async () => {
			currentUser = mapUserToCurrentUser(teacherUser, teacherAccount);
			const params: PatchMyAccountParams = {
				passwordOld: defaultPassword,
				firstName: 'Jane<script>alert("XSS")</script>',
				lastName: '<b>Doe</b>',
			};

			await request(app.getHttpServer()) //
				.patch(`${basePath}/me`)
				.send(params)
				.expect(200);

			const updatedUser = await em.findOneOrFail(User, teacherUser.id);
			expect(updatedUser.firstName).toEqual('Jane');
			expect(updatedUser.lastName).toEqual('Doe');
		});
	});

	describe('[GET]', () => {
		it('should search for user id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			const query: AccountSearchQueryParams = {
				type: AccountSearchType.USER_ID,
				value: studentUser.id,
				skip: 5,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(200);
		});
		// If skip is too big, just return an empty list.
		// We testing it here, because we are mocking the database in the use case unit tests
		// and for realistic behavior we need database.
		it('should search for user id with large skip', async () => {
			currentUser = mapUserToCurrentUser(superheroUser);
			const query: AccountSearchQueryParams = {
				type: AccountSearchType.USER_ID,
				value: studentUser.id,
				skip: 50000,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(200);
		});
		it('should search for user name', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			const query: AccountSearchQueryParams = {
				type: AccountSearchType.USERNAME,
				value: '',
				skip: 5,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(200);
		});
		it('should reject if type is unknown', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			const query: AccountSearchQueryParams = {
				type: '' as AccountSearchType,
				value: '',
				skip: 5,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(400);
		});
		it('should reject if user is not authorized', async () => {
			currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			const query: AccountSearchQueryParams = {
				type: AccountSearchType.USERNAME,
				value: '',
				skip: 5,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(403);
		});
	});

	describe('[GET] :id', () => {
		it('should return account for account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		it('should reject if user is not a authorized', async () => {
			currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			await request(app.getHttpServer()) //
				.get(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});

	describe('[PATCH] :id', () => {
		it('should update account', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, superheroAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${studentAccount.id}`)
				.send(body)
				.expect(200);
		});
		it('should reject if user is not authorized', async () => {
			currentUser = mapUserToCurrentUser(studentUser, studentAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${studentAccount.id}`)
				.send(body)
				.expect(403);
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			const body: AccountByIdBodyParams = {
				password: defaultPassword,
				username: studentAccount.username,
				activated: true,
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/000000000000000000000000`)
				.send(body)
				.expect(404);
		});
	});

	describe('[DELETE] :id', () => {
		it('should delete account', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		it('should reject if user is not a authorized', async () => {
			currentUser = mapUserToCurrentUser(adminUser, adminAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroUser, studentAccount);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { accountFactory, mapUserToCurrentUser, roleFactory, schoolFactory, userFactory } from '@shared/testing';
import {
	AccountByIdBodyParams,
	AccountSearchQueryParams,
	AccountSearchType,
	PatchMyAccountParams,
	PatchMyPasswordParams,
} from '@src/modules/authentication/controller/dto';
import { Account, ICurrentUser, RoleName, User } from '@shared/domain';

describe('Account Controller (e2e)', () => {
	const basePath = '/account';

	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;

	let adminAccount: Account;
	let teacherAccount: Account;
	let studentAccount: Account;
	let superheroAccount: Account;

	let currentUser: ICurrentUser;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setup = async () => {
		const school = schoolFactory.buildWithId();

		const adminRoles = roleFactory.build({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] });
		const teacherRoles = roleFactory.build({ name: 'teacher', permissions: ['STUDENT_EDIT'] });
		const studentRoles = roleFactory.build({ name: 'student', permissions: [] });
		const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

		const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
		const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });
		const superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

		const mapUserToAccount = (user: User): Account => {
			return accountFactory.buildWithId({
				user,
				username: user.email,
				system: undefined,
				password: defaultPasswordHash,
			});
		};
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

	beforeEach(async () => {
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
		orm = app.get(MikroORM);
		em = app.get(EntityManager);
		await setup();
	});

	afterEach(async () => {
		// await cleanupCollections(em);
		await app.close();
		await orm.close();
	});

	describe('[PATCH] me/password', () => {
		it(`should update the current user's (temporary) password`, async () => {
			currentUser = mapUserToCurrentUser(studentAccount.user);
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
			currentUser = mapUserToCurrentUser(studentAccount.user);
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
			currentUser = mapUserToCurrentUser(studentAccount.user);
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
			currentUser = mapUserToCurrentUser(studentAccount.user);
			const params: PatchMyAccountParams = {
				passwordOld: defaultPassword,
				email: 'invalid',
			};
			await request(app.getHttpServer()) //
				.patch(`${basePath}/me`)
				.send(params)
				.expect(400);
		});
	});

	describe('[GET]', () => {
		it('should search for user id', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			const query: AccountSearchQueryParams = {
				type: AccountSearchType.USER_ID,
				value: studentAccount.user.id,
				skip: 5,
				limit: 5,
			};
			await request(app.getHttpServer()) //
				.get(`${basePath}`)
				.query(query)
				.send()
				.expect(200);
		});
		it('should search for user name', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
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
			currentUser = mapUserToCurrentUser(superheroAccount.user);
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
			currentUser = mapUserToCurrentUser(adminAccount.user);
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
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		it('should reject if id has invalid format', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.get(`${basePath}/qwerty`)
				.send()
				.expect(400);
		});
		it('should reject if user is not a authorized', async () => {
			currentUser = mapUserToCurrentUser(adminAccount.user);
			await request(app.getHttpServer()) //
				.get(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.get(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});

	describe('[PATCH] :id', () => {
		it('should update account', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
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
			currentUser = mapUserToCurrentUser(studentAccount.user);
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
			currentUser = mapUserToCurrentUser(superheroAccount.user);
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
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(200);
		});
		it('should reject invalid account id format', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/qwerty`)
				.expect(400);
		});
		it('should reject if user is not a authorized', async () => {
			currentUser = mapUserToCurrentUser(adminAccount.user);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/${studentAccount.id}`)
				.expect(403);
		});
		it('should reject not existing account id', async () => {
			currentUser = mapUserToCurrentUser(superheroAccount.user);
			await request(app.getHttpServer()) //
				.delete(`${basePath}/000000000000000000000000`)
				.expect(404);
		});
	});
});

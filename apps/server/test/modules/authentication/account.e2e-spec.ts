import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { roleFactory, schoolFactory, userFactory, mapUserToCurrentUser, accountFactory } from '@shared/testing';
import {
	ChangePasswordParams,
	PatchMyAccountParams,
	PutMyPasswordParams,
} from '@src/modules/authentication/controller/dto';
import { User, ICurrentUser, Account } from '@shared/domain';

describe('Account Controller (e2e)', () => {
	const basePath = '/account';

	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;

	let adminAccount: Account;
	let teacherAccount: Account;
	let studentAccount: Account;

	let currentUser: ICurrentUser;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	const setup = async () => {
		const school = schoolFactory.buildWithId();

		const adminRoles = roleFactory.build({ name: 'administrator', permissions: ['TEACHER_EDIT', 'STUDENT_EDIT'] });
		const teacherRoles = roleFactory.build({ name: 'teacher', permissions: ['STUDENT_EDIT'] });
		const studentRoles = roleFactory.build({ name: 'student', permissions: [] });

		const adminUser = userFactory.buildWithId({ school, roles: [adminRoles] });
		const teacherUser = userFactory.buildWithId({ school, roles: [teacherRoles] });
		const studentUser = userFactory.buildWithId({ school, roles: [studentRoles] });

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

		em.persist(school);
		em.persist([adminRoles, teacherRoles, studentRoles]);
		em.persist([adminUser, teacherUser, studentUser]);
		em.persist([adminAccount, teacherAccount, studentAccount]);
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

	describe('[PATCH] :id/pw', () => {
		it(`should update a user's password as administrator`, async () => {
			currentUser = mapUserToCurrentUser(adminAccount.user);
			const params: ChangePasswordParams = { password: 'Valid12$' };
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${teacherAccount.user.id}/pw`)
				.send(params)
				.expect(200);
			const updatedAccount = await em.findOneOrFail(Account, teacherAccount.id);
			expect(updatedAccount.password).not.toEqual(defaultPasswordHash);
		});
		it('should reject if password is weak', async () => {
			currentUser = mapUserToCurrentUser(adminAccount.user);
			const params: ChangePasswordParams = { password: 'weak' };
			await request(app.getHttpServer()) //
				.patch(`${basePath}/${teacherAccount.user.id}/pw`)
				.send(params)
				.expect(400);
		});
	});

	describe('[PUT] me/password', () => {
		it(`should update the current user's (temporary) password`, async () => {
			currentUser = mapUserToCurrentUser(studentAccount.user);
			const params: PutMyPasswordParams = {
				password: 'Valid12$',
				confirmPassword: 'Valid12$',
			};
			await request(app.getHttpServer()) //
				.put(`${basePath}/me/password`)
				.send(params)
				.expect(200);

			const updatedAccount = await em.findOneOrFail(Account, studentAccount.id);
			expect(updatedAccount.password).not.toEqual(defaultPasswordHash);
		});
		it('should reject if new password is weak', async () => {
			currentUser = mapUserToCurrentUser(studentAccount.user);
			const params: PutMyPasswordParams = {
				password: 'weak',
				confirmPassword: 'weak',
			};
			await request(app.getHttpServer()) //
				.put(`${basePath}/me/password`)
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
});

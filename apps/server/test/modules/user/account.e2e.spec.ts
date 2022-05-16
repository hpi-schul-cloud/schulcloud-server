import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { roleFactory, userFactory, mapUserToCurrentUser, accountFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/server.module';
import request from 'supertest';
import { Request } from 'express';
import { Account, ICurrentUser, RoleName, User } from '@shared/domain';

describe('/user/:id/account', () => {
	const basePath = '/user';

	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;

	let studentAccount: Account;
	let superheroAccount: Account;

	let studentUser: User;
	let superheroUser: User;

	let currentUser: ICurrentUser;

	const setup = async () => {
		const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
		const superheroRoles = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });

		studentUser = userFactory.buildWithId({ roles: [studentRoles] });
		superheroUser = userFactory.buildWithId({ roles: [superheroRoles] });

		const mapUserToAccount = (user: User): Account => {
			return accountFactory.buildWithId({
				user,
				username: user.email,
				system: undefined,
			});
		};
		studentAccount = mapUserToAccount(studentUser);
		superheroAccount = mapUserToAccount(superheroUser);

		em.persist([studentRoles, superheroRoles]);
		em.persist([studentUser, superheroUser]);
		em.persist([studentAccount, superheroAccount]);
		await em.flush();
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
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

		app = module.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
		em = app.get(EntityManager);
		await setup();
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	it('should return status 200', async () => {
		currentUser = mapUserToCurrentUser(superheroAccount.user, superheroAccount);
		const userId = studentUser.id;
		await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`)
			.expect(200);
	});
	it('should return status 403', async () => {
		currentUser = mapUserToCurrentUser(studentUser);
		const userId = studentUser.id;
		await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`)
			.expect(403);
	});
	it('should return status 404', async () => {
		currentUser = mapUserToCurrentUser(superheroUser);
		const userId = '';
		await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`)
			.expect(404);
	});
});

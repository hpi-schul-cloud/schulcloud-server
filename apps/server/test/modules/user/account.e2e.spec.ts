import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { roleFactory, userFactory, mapUserToCurrentUser, accountFactory, schoolFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/server.module';
import request from 'supertest';
import { Request } from 'express';
import { ICurrentUser, RoleName } from '@shared/domain';

describe('/user/:id/account', () => {
	const basePath = '/user';
	const role = roleFactory.build({ name: RoleName.SUPERHERO, permissions: [] });
	const user = userFactory.buildWithId({ roles: [role] });
	const account = accountFactory.buildWithId({
		user,
		username: user.email,
	});

	let module: TestingModule;
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
		app = await module.createNestApplication().init();
		orm = app.get(MikroORM);
		em = app.get(EntityManager);

		await em.persistAndFlush([role, user, account]);
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
		await module.close();
	});

	it('should return status 200', async () => {
		currentUser = mapUserToCurrentUser(user, account);
		const userId = user.id;
		const result = await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`);

		expect(result).toBeDefined();
	});
	it('should return status 403', async () => {
		currentUser = mapUserToCurrentUser(user);
		const userId = user.id;
		await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`)
			.expect(403);
	});
	it('should return status 404', async () => {
		currentUser = mapUserToCurrentUser(user);
		const userId = '';
		await request(app.getHttpServer()) //
			.get(`${basePath}/${userId}/account`)
			.expect(404);
	});
});

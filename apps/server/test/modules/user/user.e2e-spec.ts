import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ServerTestModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { roleFactory, userFactory, mapUserToCurrentUser } from '@shared/testing';

describe('User Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();

					const roles = roleFactory.buildList(1, { permissions: [] });
					const user = userFactory.build({ roles });

					const currentUser = mapUserToCurrentUser(user);
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
	});

	afterEach(async () => {
		await app.close();
		await orm.close();
	});

	it('[GET] user/me', async () => {
		const response = await request(app.getHttpServer()).get('/user/me');
		expect(response.status === 200);
	});

	it.todo('more user/me test missing');
});

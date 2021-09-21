import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';

describe('User Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					const { currentUser } = createCurrentTestUser();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get<MikroORM>(MikroORM);
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

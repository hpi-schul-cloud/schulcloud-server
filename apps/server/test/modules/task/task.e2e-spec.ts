import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ServerModule } from '../../../src/server.module';
import { JwtAuthGuard } from '../../../src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '../../../src/modules/user/utils';

describe('Task Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;

	beforeAll(async () => {
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

	beforeEach(async () => {
		// TODO await em.nativeDelete(CollectionName, {});
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	it('[FIND] /task/dashboard', async () => {
		const response = await request(app.getHttpServer()).get('/task/dashboard');
		expect(response.status === 200);
	});

	it.todo('more /task/dashboard test missing');
});

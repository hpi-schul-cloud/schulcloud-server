import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ServerModule } from '../../../src/server.module';
import { JwtAuthGuard } from '../../../src/modules/authentication/guard/jwt-auth.guard';
import { ICurrentUser } from '../../../src/modules/authentication/interface/jwt-payload';

describe('Task Controller (e2e)', () => {
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
					const user: ICurrentUser = {
						userId: '0000d224816abba584714c9c',
						roles: [],
						schoolId: '5f2987e020834114b8efd6f8',
						accountId: '0000d225816abba584714c9d',
					};
					req.user = user;
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

	it('/ (FIND)', async () => {
		const response = await request(app.getHttpServer()).get('/task/dashboard');
		expect(response.status == 200);
	});
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';

import { PaginationResponse } from '@shared/controller';
import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';

import { TaskTestHelper } from '@src/modules/task/utils';
import { TaskResponse } from '@src/modules/task/controller/dto';

// teacherDashboard: 'TASK_DASHBOARD_TEACHER_VIEW_V3',
// 		studentDashboard: 'TASK_DASHBOARD_VIEW_V3',

describe('Task Controller (e2e)', () => {
	describe('without permissions', () => {
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
						const { currentUser } = createCurrentTestUser([]);
						req.user = currentUser;
						return true;
					},
				})
				.compile();

			app = moduleFixture.createNestApplication();
			await app.init();
			orm = app.get(MikroORM);
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		it('[FIND] /task/dashboard', async () => {
			const response = await request(app.getHttpServer()).get('/task/dashboard');
			expect(response.status).toEqual(401);
		});
	});

	describe('as user with write permissions in parents', () => {
		let app: INestApplication;
		let orm: MikroORM;
		const { currentUser } = createCurrentTestUser(['TASK_DASHBOARD_TEACHER_VIEW_V3']);

		beforeAll(async () => {
			const moduleFixture: TestingModule = await Test.createTestingModule({
				imports: [ServerModule],
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
			orm = app.get<MikroORM>(MikroORM);
		});

		afterAll(async () => {
			await orm.close();
			await app.close();
		});

		it('[FIND] /task/dashboard can open it', async () => {
			const response = await request(app.getHttpServer()).get('/task/dashboard');
			expect(response.status).toEqual(200);
		});
		// remove data?
		it('[FIND] /task/dashboard return tasks that include the appropriate information.', async () => {
			const helper = new TaskTestHelper();
			const userId = helper.getFirstUser().id;
			currentUser.user.id = userId;
			currentUser.userId = userId;
			const parent = helper.createTaskParent();
			parent.userIdWithWritePermissions = userId;
			const task = helper.createTask(parent.id);

			const response = await request(app.getHttpServer()).get('/task/dashboard');
			const paginatedResult = response.body as PaginationResponse<TaskResponse[]>;

			expect(paginatedResult.data[0]).toBeDefined();
			expect(paginatedResult.data[0]).toHaveProperty('status');
			expect(paginatedResult.data[0]).toHaveProperty('color');
			expect(paginatedResult.data[0]).toHaveProperty('name');
		});

		it('[FIND] /task/dashboard return a list of', async () => {
			const response = await request(app.getHttpServer()).get('/task/dashboard');
			expect(response.body).toHaveProperty('status');
			expect(response.body).toHaveProperty('color');
			expect(response.body).toHaveProperty('name');
		});
		// response list
	});

	describe('as user with read permissions in parents', () => {});
});

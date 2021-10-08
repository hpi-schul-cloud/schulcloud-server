import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerModule } from '@src/server.module';
import { DashboardResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { createCurrentTestUser } from '@src/modules/user/utils';
import { DashboardEntity, GridElement, DefaultGridReference } from '@shared/domain';
import { IDashboardRepo } from '@src/repositories/learnroom/dashboard.repo';

describe('Dashboard Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let dashboardRepo: IDashboardRepo;

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
		dashboardRepo = app.get<IDashboardRepo>('DASHBOARD_REPO');
	});

	afterEach(async () => {
		await app.close();
		await orm.close();
	});

	it('[GET] dashboard', async () => {
		const response = await request(app.getHttpServer()).get('/dashboard');
		expect(response.status).toEqual(200);
		const body = response.body as DashboardResponse;
		expect(typeof body.gridElements[0].title).toBe('string');
	});

	describe('[PATCH] /:id/moveElement', () => {
		it('should update position of target element', async () => {
			const dashboard = new DashboardEntity(new ObjectId().toString(), {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: new GridElement(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Mathe')
						),
					},
				],
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4, y: 2 },
			};
			const resonse = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(200);
		});
	});
});

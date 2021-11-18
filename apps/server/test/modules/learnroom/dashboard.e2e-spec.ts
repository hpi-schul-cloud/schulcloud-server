import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { ServerModule } from '@src/server.module';
import { DashboardResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { DashboardEntity, GridElement, DefaultGridReference } from '@shared/domain';
import { IDashboardRepo } from '@shared/repo';

describe('Dashboard Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let dashboardRepo: IDashboardRepo;
	const user = {
		userId: '0000d224816abba584714c9c',
		roles: [],
		schoolId: '5f2987e020834114b8efd6f8',
		accountId: '0000d225816abba584714c9d',
	};

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = user;
					return true;
				},
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		orm = app.get(MikroORM);
		dashboardRepo = app.get('DASHBOARD_REPO');
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
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Mathe')
						),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4, y: 2 },
			};
			const resonse = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(200);
		});

		it('should create groups', async () => {
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Quantumphysics')
						),
					},
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Astrophysics')
						),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 1, y: 3 },
				to: { x: 2, y: 2 },
			};
			const response = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0]).toHaveProperty('groupElements');
		});

		it('should add element to group', async () => {
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'mannequinization')
						),
					},
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							new DefaultGridReference(new ObjectId().toString(), 'Perspective Drawing'),
							new DefaultGridReference(new ObjectId().toString(), 'Shape Manipulation'),
						]),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 2, y: 2 },
				to: { x: 3, y: 3 },
			};
			const response = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0]).toHaveProperty('groupElements');
		});

		it('should remove element from group', async () => {
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							new DefaultGridReference(new ObjectId().toString(), 'Perspective Drawing'),
							new DefaultGridReference(new ObjectId().toString(), 'Shape Manipulation'),
						]),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 3, y: 3, groupIndex: 0 },
				to: { x: 2, y: 3 },
			};
			const response = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(2);
		});

		it('should fail with incomplete input', async () => {
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							new DefaultGridReference(new ObjectId().toString(), 'Mathe')
						),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4 },
			};
			const resonse = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(400);
		});
	});

	describe('PATCH /:id/element', () => {
		it('should be able to rename group', async () => {
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.userId);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							new DefaultGridReference(new ObjectId().toString(), 'Perspective Drawing'),
							new DefaultGridReference(new ObjectId().toString(), 'Shape Manipulation'),
						]),
					},
				],
				userId: user.userId,
			});
			await dashboardRepo.persistAndFlush(dashboard);

			const params = {
				title: 'COURSESILOVE',
			};
			const response = await request(app.getHttpServer())
				.patch(`/dashboard/${dashboard.id}/element?x=3&y=3`)
				.send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0].title).toEqual('COURSESILOVE');
		});
	});
});

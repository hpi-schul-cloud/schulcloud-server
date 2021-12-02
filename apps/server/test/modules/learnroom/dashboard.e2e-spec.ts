import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerModule } from '@src/server.module';
import { DashboardResponse } from '@src/modules/learnroom/controller/dto';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { DashboardEntity, GridElement, ICurrentUser, User } from '@shared/domain';
import { IDashboardRepo } from '@shared/repo';
import { courseFactory, userFactory, createCurrentTestUser } from '@shared/testing';

describe('Dashboard Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let dashboardRepo: IDashboardRepo;
	let currentUser: ICurrentUser;

	beforeEach(async () => {
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
		orm = app.get(MikroORM);
		em = app.get(EntityManager);
		dashboardRepo = app.get('DASHBOARD_REPO');
		currentUser = createCurrentTestUser(['TASK_DASHBOARD_TEACHER_VIEW_V3']).currentUser;
	});

	const setCurrentUser = (user: User) => {
		currentUser.user.id = user.id;
		currentUser.userId = user.id;
	};

	afterEach(async () => {
		await app.close();
		await orm.close();
	});

	it('[GET] dashboard', async () => {
		const user = userFactory.build();
		await em.persistAndFlush([user]);
		const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
		setCurrentUser(user);
		const response = await request(app.getHttpServer()).get('/dashboard');
		expect(response.status).toEqual(200);
		const body = response.body as DashboardResponse;
		expect(body.id).toEqual(dashboardId);
	});

	describe('[PATCH] /:id/moveElement', () => {
		it('should update position of target element', async () => {
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'Mathe' })
						),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4, y: 2 },
			};

			const resonse = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(200);
		});

		it('should create groups', async () => {
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'Quantumphysics' })
						),
					},
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'Astrophysics' })
						),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
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
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'mannequinization' })
						),
					},
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseFactory.build({ students: [user], name: 'Perspective Drawing' }),
							courseFactory.build({ students: [user], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
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
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseFactory.build({ students: [user], name: 'Perspective Drawing' }),
							courseFactory.build({ students: [user], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
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
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseFactory.build({ students: [user], name: 'Mathe' })
						),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
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
			const user = userFactory.build();
			await em.persistAndFlush([user]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseFactory.build({ students: [user], name: 'Perspective Drawing' }),
							courseFactory.build({ students: [user], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: user.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			setCurrentUser(user);
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

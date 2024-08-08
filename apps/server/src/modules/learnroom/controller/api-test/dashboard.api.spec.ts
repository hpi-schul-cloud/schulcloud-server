import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { DashboardResponse } from '@modules/learnroom/controller/dto';
import { ServerTestModule } from '@modules/server/server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEntity, GridElement, User } from '@shared/domain/entity';
import { Permission, RoleName } from '@shared/domain/interface';
import { IDashboardRepo } from '@shared/repo';
import { courseFactory, mapUserToCurrentUser, roleFactory, userFactory } from '@shared/testing';
import { JwtAuthGuard } from '@src/infra/auth-guard/guard/jwt-auth.guard';
import { Request } from 'express';
import request from 'supertest';

describe('Dashboard Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let dashboardRepo: IDashboardRepo;
	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
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

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		dashboardRepo = app.get('DASHBOARD_REPO');
	});

	afterAll(async () => {
		await app.close();
	});

	const setup = () => {
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3],
		});
		const user = userFactory.build({ roles });

		return user;
	};

	const setupWithRole = (roleName: RoleName) => {
		const roles = roleFactory.buildList(1, {
			permissions: [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3],
			name: roleName,
		});
		const user = userFactory.build({ roles });

		return user;
	};

	const courseBuild = (student: User, teacher: User, time: number) => [
		courseFactory.build({ name: 'should appear', students: [student] }),
		courseFactory.build({ name: 'should appear', substitutionTeachers: [teacher], students: [student] }),
		courseFactory.build({
			name: 'should appear',
			teachers: [teacher],
			students: [student],
			untilDate: new Date(Date.now() + time),
		}),
		courseFactory.build({ name: 'should appear', teachers: [teacher], students: [student] }),
		courseFactory.build({ name: 'should not appear, not users course' }),
		courseFactory.build({
			name: 'should not appear, enddate is in the past',
			students: [student],
			untilDate: new Date(Date.now() - time),
		}),
	];

	describe('[GET] dashboard', () => {
		it('should return dashboard with users active courses', async () => {
			const user = setup();
			const twoDaysInMilliSeconds = 172800000;
			const courses = courseBuild(user, user, twoDaysInMilliSeconds);
			await em.persistAndFlush([user, ...courses]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(user.id);
			currentUser = mapUserToCurrentUser(user);

			const response = await request(app.getHttpServer()).get('/dashboard');

			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.id).toEqual(dashboardId);
			expect(body.gridElements.length).toEqual(4);
			const elementNames = [...body.gridElements].map((gridElement) => gridElement.title);
			elementNames.forEach((name) => {
				expect(name).toEqual('should appear');
			});
		});

		it('should return dashboard with teacher active courses', async () => {
			const teacher = setupWithRole(RoleName.TEACHER);
			const student = setupWithRole(RoleName.STUDENT);
			const twoDaysInMilliSeconds = 172800000;
			const courses = courseBuild(student, teacher, twoDaysInMilliSeconds);
			await em.persistAndFlush([teacher, ...courses]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(teacher.id);
			currentUser = mapUserToCurrentUser(teacher);

			const response = await request(app.getHttpServer()).get('/dashboard');

			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.id).toEqual(dashboardId);
			expect(body.gridElements.length).toEqual(3);
			const elementNames = [...body.gridElements].map((gridElement) => gridElement.title);
			elementNames.forEach((name) => {
				expect(name).toEqual('should appear');
			});
		});

		it('should return dashboard with student active courses', async () => {
			const student = setupWithRole(RoleName.STUDENT);
			const teacher = setupWithRole(RoleName.TEACHER);
			const twoDaysInMilliSeconds = 172800000;
			const courses = courseBuild(student, teacher, twoDaysInMilliSeconds);
			await em.persistAndFlush([student, ...courses]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(student.id);
			currentUser = mapUserToCurrentUser(student);

			const response = await request(app.getHttpServer()).get('/dashboard');

			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.id).toEqual(dashboardId);
			expect(body.gridElements.length).toEqual(4);
			const elementNames = [...body.gridElements].map((gridElement) => gridElement.title);
			elementNames.forEach((name) => {
				expect(name).toEqual('should appear');
			});
		});
	});

	describe('[PATCH] /:id/moveElement', () => {
		it('should update position of target element', async () => {
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4, y: 2 },
			};

			const resonse = await request(app.getHttpServer()).patch(`/dashboard/${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(200);
		});

		it('should create groups', async () => {
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
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
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
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
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
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
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
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
			const user = setup();
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
			currentUser = mapUserToCurrentUser(user);
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

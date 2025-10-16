import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { User } from '@modules/user/repo';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { Dashboard, GridElement } from '../../domain/do/dashboard';
import { DASHBOARD_REPO, IDashboardRepo } from '../../repo/mikro-orm/dashboard.repo';
import { DashboardResponse } from '../dto';
import { schoolEntityFactory } from '@modules/school/testing';

describe('Dashboard Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let dashboardRepo: IDashboardRepo;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		dashboardRepo = app.get(DASHBOARD_REPO);

		apiClient = new TestApiClient(app, '/dashboard');
	});

	afterAll(async () => {
		await app.close();
	});

	const courseBuild = (student: User, teacher: User, time: number) => [
		courseEntityFactory.build({ name: 'should appear', students: [student], school: teacher.school }),
		courseEntityFactory.build({
			name: 'should appear',
			substitutionTeachers: [teacher],
			students: [student],
			school: teacher.school,
		}),
		courseEntityFactory.build({
			name: 'should appear',
			teachers: [teacher],
			students: [student],
			school: teacher.school,
			untilDate: new Date(Date.now() + time),
		}),
		courseEntityFactory.build({
			name: 'should appear',
			teachers: [teacher],
			students: [student],
			school: teacher.school,
		}),
		courseEntityFactory.build({ name: 'should not appear, not users course' }),
		courseEntityFactory.build({
			name: 'should not appear, enddate is in the past',
			students: [student],
			untilDate: new Date(Date.now() - time),
		}),
		courseEntityFactory.build({ name: 'should not appear, not users school', teachers: [teacher] }),
	];

	describe('[GET] dashboard', () => {
		describe('with logged in teacher', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const twoDaysInMilliSeconds = 172800000;
				const courses = courseBuild(studentUser, teacherUser, twoDaysInMilliSeconds);
				await em.persistAndFlush([teacherUser, teacherAccount, studentUser, ...courses]);
				const { id: dashboardId } = await dashboardRepo.getUsersDashboard(teacherUser.id);

				const loggedInClient = await apiClient.login(teacherAccount);

				return { teacherUser, dashboardId, loggedInClient };
			};

			it('should return dashboard with teachers active courses', async () => {
				const { dashboardId, loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(200);
				const body = response.body as DashboardResponse;
				expect(body.id).toEqual(dashboardId);
				expect(body.gridElements.length).toEqual(3);
				const elementNames = [...body.gridElements].map((gridElement) => gridElement.title);
				elementNames.forEach((name) => {
					expect(name).toEqual('should appear');
				});
			});
		});

		describe('with not logged in teacher', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const twoDaysInMilliSeconds = 172800000;
				const courses = courseBuild(studentUser, teacherUser, twoDaysInMilliSeconds);
				await em.persistAndFlush([teacherUser, teacherAccount, studentUser, ...courses]);
				const { id: dashboardId } = await dashboardRepo.getUsersDashboard(teacherUser.id);

				return { teacherUser, dashboardId };
			};

			it('should return status 401', async () => {
				await setup();

				const response = await apiClient.get();

				expect(response.status).toEqual(401);
			});
		});

		describe('with logged in student', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const twoDaysInMilliSeconds = 172800000;
				const courses = courseBuild(studentUser, teacherUser, twoDaysInMilliSeconds);
				const lockedCourse = courseEntityFactory.build({
					name: 'locked course',
					teachers: [],
					students: [studentUser],
					school: school,
				});
				await em.persistAndFlush([teacherUser, studentAccount, studentUser, ...courses, lockedCourse]);
				const { id: dashboardId } = await dashboardRepo.getUsersDashboard(studentUser.id);

				const loggedInClient = await apiClient.login(studentAccount);

				return { teacherUser, dashboardId, loggedInClient };
			};

			it('should return dashboard with student active courses', async () => {
				const { dashboardId, loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(200);
				const body = response.body as DashboardResponse;
				expect(body.id).toEqual(dashboardId);
				expect(body.gridElements.length).toEqual(5);
			});

			it('should return locked course with isLocked property', async () => {
				const { dashboardId, loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(200);
				const body = response.body as DashboardResponse;
				expect(body.id).toEqual(dashboardId);
				expect(body.gridElements.length).toEqual(5);

				const lockedCourse = body.gridElements.find((element) => element.title === 'locked course');
				expect(lockedCourse?.isLocked).toBe(true);
			});
		});
	});

	describe('[PATCH] /:id/moveElement', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentUser } = UserAndAccountTestFactory.buildStudent();
			const twoDaysInMilliSeconds = 172800000;
			const courses = courseBuild(studentUser, teacherUser, twoDaysInMilliSeconds);
			await em.persistAndFlush([teacherUser, teacherAccount, studentUser, ...courses]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(teacherUser.id);

			const loggedInClient = await apiClient.login(teacherAccount);

			return { teacherUser, dashboardId, loggedInClient };
		};

		it('should update position of target element', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseEntityFactory.build({ students: [teacherUser], name: 'Mathe' })
						),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4, y: 2 },
			};

			const resonse = await loggedInClient.patch(`${dashboardId}/moveElement`).send(params);
			expect(resonse.status).toEqual(200);
		});

		it('should create groups', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseEntityFactory.build({ students: [teacherUser], name: 'Quantumphysics' })
						),
					},
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseEntityFactory.build({ students: [teacherUser], name: 'Astrophysics' })
						),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				from: { x: 1, y: 3 },
				to: { x: 2, y: 2 },
			};

			const response = await loggedInClient.patch(`${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0]).toHaveProperty('groupElements');
		});

		it('should add element to group', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 2, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseEntityFactory.build({ students: [teacherUser], name: 'mannequinization' })
						),
					},
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseEntityFactory.build({ students: [teacherUser], name: 'Perspective Drawing' }),
							courseEntityFactory.build({ students: [teacherUser], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				from: { x: 2, y: 2 },
				to: { x: 3, y: 3 },
			};

			const response = await loggedInClient.patch(`${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0]).toHaveProperty('groupElements');
		});

		it('should remove element from group', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseEntityFactory.build({ students: [teacherUser], name: 'Perspective Drawing' }),
							courseEntityFactory.build({ students: [teacherUser], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				from: { x: 3, y: 3, groupIndex: 0 },
				to: { x: 2, y: 3 },
			};

			const response = await loggedInClient.patch(`${dashboard.id}/moveElement`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(2);
		});

		it('should fail with incomplete input', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 3 },
						gridElement: GridElement.FromPersistedReference(
							new ObjectId().toString(),
							courseEntityFactory.build({ students: [teacherUser], name: 'Mathe' })
						),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				from: { x: 1, y: 3 },
				to: { x: 4 },
			};
			const resonse = await loggedInClient.patch(`${dashboard.id}/moveElement`).send(params);
			expect(resonse.status).toEqual(400);
		});
	});

	describe('PATCH /:id/element', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const { studentUser } = UserAndAccountTestFactory.buildStudent();
			const twoDaysInMilliSeconds = 172800000;
			const courses = courseBuild(studentUser, teacherUser, twoDaysInMilliSeconds);
			await em.persistAndFlush([teacherUser, teacherAccount, studentUser, ...courses]);
			const { id: dashboardId } = await dashboardRepo.getUsersDashboard(teacherUser.id);

			const loggedInClient = await apiClient.login(teacherAccount);

			return { teacherUser, dashboardId, loggedInClient };
		};

		it('should be able to rename group', async () => {
			const { loggedInClient, dashboardId, teacherUser } = await setup();

			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 3, y: 3 },
						gridElement: GridElement.FromPersistedGroup(new ObjectId().toString(), 'drawing', [
							courseEntityFactory.build({ students: [teacherUser], name: 'Perspective Drawing' }),
							courseEntityFactory.build({ students: [teacherUser], name: 'Shape Manipulation' }),
						]),
					},
				],
				userId: teacherUser.id,
			});
			await dashboardRepo.persistAndFlush(dashboard);
			const params = {
				title: 'COURSESILOVE',
			};
			const response = await loggedInClient.patch(`${dashboard.id}/element?x=3&y=3`).send(params);
			expect(response.status).toEqual(200);
			const body = response.body as DashboardResponse;
			expect(body.gridElements.length).toEqual(1);
			expect(body.gridElements[0].title).toEqual('COURSESILOVE');
		});
	});
});

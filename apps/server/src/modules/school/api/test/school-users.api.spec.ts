import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
	cleanupCollections,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { SchoolUserListResponse } from '../dto/response/school-user.response';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		await em.clearCache('roles-cache-byname-teacher');
		await em.clearCache('roles-cache-bynames-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('get Teachers', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`${someId}/teachers`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when schoolId is invalid format', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`/123/teachers`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when schoolId doesnt exist', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`/${someId}/teachers`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in the correct school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const otherSchool = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
				const teacherRole = teacherUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });
				const publicTeachersOfSchool = userFactory.buildList(2, { school, roles: [teacherRole], discoverable: true });

				await em.persistAndFlush([teacherAccount, teacherUser, ...teachersOfSchool, ...publicTeachersOfSchool]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, teachersOfSchool, school, publicTeachersOfSchool };
			};

			it('should return only public teachers', async () => {
				const { loggedInClient, school, publicTeachersOfSchool } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);
				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.total).toEqual(publicTeachersOfSchool.length);
				expect(body.data).toEqual(
					expect.arrayContaining([
						...publicTeachersOfSchool.map((teacher) => {
							return {
								id: teacher.id,
								firstName: teacher.firstName,
								lastName: teacher.lastName,
								schoolName: school.name,
							};
						}),
					])
				);
			});
		});

		describe('when user has no permission to view teachers', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
				const teacherRole = studentUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });

				await em.persistAndFlush([studentAccount, studentUser, ...teachersOfSchool]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient, studentUser, teachersOfSchool, school };
			};

			it('should return 403', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has permission to view teachers', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const teacherRole = teacherUser.roles[0];
				const teachersOfSchool = userFactory.buildList(3, { school, roles: [teacherRole] });

				const otherSchool = schoolEntityFactory.build();
				const teachersOfOtherSchool = userFactory.buildList(3, { school: otherSchool, roles: [teacherRole] });

				await em.persistAndFlush([teacherAccount, teacherUser, ...teachersOfSchool, ...teachersOfOtherSchool]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser, teachersOfSchool, school };
			};

			it('should return 200 with teachers', async () => {
				const { loggedInClient, teacherUser, teachersOfSchool, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`);

				const body = response.body as SchoolUserListResponse;

				expect(response.status).toEqual(HttpStatus.OK);
				expect(body.data).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							id: teacherUser.id,
							firstName: teacherUser.firstName,
							lastName: teacherUser.lastName,
						}),
						...teachersOfSchool.map((teacher) => {
							return {
								id: teacher.id,
								firstName: teacher.firstName,
								lastName: teacher.lastName,
								schoolName: school.name,
							};
						}),
					])
				);
			});

			it('should paginate', async () => {
				const { loggedInClient, school } = await setup();

				const response = await loggedInClient.get(`${school.id}/teachers`).query({ skip: 1, limit: 1 });
				const body = response.body as SchoolUserListResponse;

				expect(body.data).toHaveLength(1);
				expect(body.total).toEqual(4);
				expect(body.skip).toEqual(1);
			});
		});
	});
});

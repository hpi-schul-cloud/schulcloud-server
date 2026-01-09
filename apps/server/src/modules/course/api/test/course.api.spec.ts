import { faker } from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/mongodb';
import { groupEntityFactory } from '@modules/group/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { CourseEntity } from '../../repo';
import { courseEntityFactory } from '../../testing';
import { CourseMetadataListResponse } from '../dto';
import { CourseCommonCartridgeMetadataResponse } from '../dto/course-cc-metadata.response';
import { schoolEntityFactory } from '@modules/management/seed-data/factory/school.entity.factory';
import { SchoolEntity } from '@modules/school/repo';

const createStudent = (school: SchoolEntity) => {
	const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school }, [Permission.COURSE_VIEW]);
	return { account: studentAccount, user: studentUser };
};
const createTeacher = (school: SchoolEntity) => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school }, [
		Permission.COURSE_VIEW,
		Permission.COURSE_EDIT,
		Permission.COURSE_CREATE,
	]);
	return { account: teacherAccount, user: teacherUser };
};

describe('Course Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, 'courses');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('[GET] /courses/', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const student = createStudent(school);
			const teacher = createTeacher(school);
			const course = courseEntityFactory.buildWithId({
				teachers: [teacher.user],
				students: [student.user],
				school,
			});
			const courseWithoutTeacher = courseEntityFactory.buildWithId({
				teachers: [],
				students: [student.user],
				school,
			});

			await em.persistAndFlush([
				teacher.account,
				teacher.user,
				student.account,
				student.user,
				course,
				courseWithoutTeacher,
			]);
			em.clear();

			return { student, course, courseWithoutTeacher, teacher };
		};

		it('should find courses as student', async () => {
			const { student, course } = await setup();

			const loggedInClient = await testApiClient.login(student.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});

		it('should find courses as teacher', async () => {
			const { teacher, course } = await setup();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});

		it('should return locked=true if course has no teachers', async () => {
			const { student, courseWithoutTeacher } = await setup();

			const loggedInClient = await testApiClient.login(student.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			const responseCourseWithoutTeacher = data.find((c) => c.id === courseWithoutTeacher.id);
			const responseCourseHavingTeacher = data.find((c) => c.id !== courseWithoutTeacher.id);
			expect(responseCourseWithoutTeacher?.isLocked).toBe(true);
			expect(responseCourseHavingTeacher?.isLocked).toBe(false);
		});
	});

	describe('[POST] /courses/:courseId/stop-sync', () => {
		describe('when a course is synchronized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: group,
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacher.account);

				return {
					loggedInClient,
					course,
				};
			};

			it('should stop the synchronization', async () => {
				const { loggedInClient, course } = await setup();

				const response = await loggedInClient.post(`${course.id}/stop-sync`);

				const result = await em.findOneOrFail(CourseEntity, course.id);
				expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
				expect(result.syncedWithGroup).toBeUndefined();
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: group,
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				return {
					course,
				};
			};

			it('should return unauthorized', async () => {
				const { course } = await setup();

				const response = await testApiClient.post(`${course.id}/stop-sync`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[GET] /courses/:courseId/user-permissions', () => {
		const setup = () => {
			const school = schoolEntityFactory.buildWithId();
			const teacher = createTeacher(school);
			const course = courseEntityFactory.buildWithId({
				teachers: [teacher.user],
				students: [],
				school,
			});

			return { course, teacher };
		};

		it('should return teacher course permissions', async () => {
			const { course, teacher } = setup();
			await em.persist([teacher.account, teacher.user, course]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${course.id}/user-permissions`);
			const data = response.body as { [key: string]: string[] };

			expect(response.statusCode).toBe(200);
			expect(data instanceof Object).toBe(true);
			expect(Array.isArray(data[teacher.user.id])).toBe(true);
			expect(data[teacher.user.id].length).toBeGreaterThan(0);
		});
	});

	describe('[POST] /courses/:courseId/start-sync', () => {
		describe('when a course is not synchronized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacher.account);

				return {
					loggedInClient,
					course,
					group,
				};
			};

			it('should start the synchronization', async () => {
				const { loggedInClient, course, group } = await setup();
				const params = { groupId: group.id };

				const response = await loggedInClient.post(`${course.id}/start-sync`).send(params);

				const result: CourseEntity = await em.findOneOrFail(CourseEntity, course.id);
				expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
				expect(result.syncedWithGroup?.id).toBe(group.id);
			});
		});

		describe('when a groupId parameter is invalid', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacher.account);
				const params = { groupId: 'not-mongo-id' };

				return {
					loggedInClient,
					course,
					group,
					params,
				};
			};

			it('should not start the synchronization with validation error', async () => {
				const { loggedInClient, course, params } = await setup();

				const response = await loggedInClient.post(`${course.id}/start-sync`).send(params);

				expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when a course is already synchronized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const otherGroup = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: otherGroup,
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacher.account);

				return {
					loggedInClient,
					course,
					group,
					otherGroup,
				};
			};

			it('should not start the synchronization', async () => {
				const { loggedInClient, course, group, otherGroup } = await setup();
				const params = { groupId: group.id };

				const response = await loggedInClient.post(`${course.id}/start-sync`).send(params);

				const result: CourseEntity = await em.findOneOrFail(CourseEntity, course.id);
				expect(response.statusCode).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
				expect(response.body).toEqual({
					code: HttpStatus.UNPROCESSABLE_ENTITY,
					message: 'Unprocessable Entity',
					title: 'Course Already Synchronized',
					type: 'COURSE_ALREADY_SYNCHRONIZED',
				});
				expect(result.syncedWithGroup?.id).toBe(otherGroup.id);
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const teacher = createTeacher(school);
				const group = groupEntityFactory.buildWithId();
				const course = courseEntityFactory.build({
					teachers: [teacher.user],
				});

				await em.persist([teacher.account, teacher.user, course, group]).flush();
				em.clear();

				return {
					course,
					group,
				};
			};

			it('should return unauthorized', async () => {
				const { course, group } = await setup();
				const params = { groupId: group.id };

				const response = await testApiClient.post(`${course.id}/start-sync`).send(params);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});
		});
	});

	describe('[GET] /courses/:courseId/cc-metadata', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const teacher = createTeacher(school);
			const course = courseEntityFactory.buildWithId({
				teachers: [teacher.user],
				students: [],
			});

			await em.persist([teacher.account, teacher.user, course]).flush();
			em.clear();

			return { course, teacher };
		};

		it('should return common cartridge metadata of a course', async () => {
			const { course, teacher } = await setup();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get(`${course.id}/cc-metadata`);
			const data = response.body as CourseCommonCartridgeMetadataResponse;

			expect(response.statusCode).toBe(200);
			expect(data.id).toBe(course.id);
		});
	});

	describe('[POST] /courses', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const teacher = createTeacher(school);
			const course = courseEntityFactory.build();

			await em.persist([teacher.account, teacher.user]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);

			return { loggedInClient, course };
		};

		it('should create course', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post().send({ name: faker.lorem.words() });

			expect(response.statusCode).toEqual(201);
		});
	});
});

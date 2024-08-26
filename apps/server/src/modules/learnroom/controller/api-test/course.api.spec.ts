import { faker } from '@faker-js/faker/locale/af_ZA';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course as CourseEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	groupEntityFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { readFile } from 'node:fs/promises';
import { CourseMetadataListResponse } from '../dto';
import { CourseCommonCartridgeMetadataResponse } from '../dto/course-cc-metadata.response';
import { CourseListResponse } from '../dto/response';
import { CourseSortQueryType, CourseStatusQueryType } from '../../domain';

const createStudent = () => {
	const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({}, [Permission.COURSE_VIEW]);
	return { account: studentAccount, user: studentUser };
};
const createTeacher = () => {
	const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [
		Permission.COURSE_VIEW,
		Permission.COURSE_EDIT,
	]);
	return { account: teacherAccount, user: teacherUser };
};

const createAdmin = () => {
	const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({}, [Permission.COURSE_ADMINISTRATION]);
	return { account: adminAccount, user: adminUser };
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

	describe('[GET] /courses/', () => {
		const setup = () => {
			const student = createStudent();
			const teacher = createTeacher();
			const course = courseFactory.buildWithId({
				teachers: [teacher.user],
				students: [student.user],
			});

			return { student, course, teacher };
		};

		it('should find courses as student', async () => {
			const { student, course } = setup();
			await em.persistAndFlush([student.account, student.user, course]);
			em.clear();

			const loggedInClient = await testApiClient.login(student.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});

		it('should find courses as teacher', async () => {
			const { teacher, course } = setup();
			await em.persistAndFlush([teacher.account, teacher.user, course]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);
			const response = await loggedInClient.get();

			const { data } = response.body as CourseMetadataListResponse;
			expect(response.statusCode).toBe(200);
			expect(typeof data[0].title).toBe('string');
			expect(data[0].startDate).toBe(course.startDate);
			expect(data[0].untilDate).toBe(course.untilDate);
		});
	});

	describe('[POST] /courses/:id/export', () => {
		const setup = async () => {
			const student1 = createStudent();
			const student2 = createStudent();
			const teacher = createTeacher();
			const substitutionTeacher = createTeacher();
			const teacherUnknownToCourse = createTeacher();
			const course = courseFactory.build({
				teachers: [teacher.user],
				students: [student1.user, student2.user],
			});

			await em.persistAndFlush([teacher.account, teacher.user, course]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);

			return { course, teacher, teacherUnknownToCourse, substitutionTeacher, student1, loggedInClient };
		};

		it('should find course export', async () => {
			const { course, loggedInClient } = await setup();

			const body = { topics: [faker.string.uuid()], tasks: [faker.string.uuid()], columnBoards: [faker.string.uuid()] };
			const response = await loggedInClient.post(`${course.id}/export?version=1.1.0`, body);

			expect(response.statusCode).toEqual(201);
			const file = response.body as StreamableFile;
			expect(file).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(response.header['content-type']).toBe('application/zip');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(response.header['content-disposition']).toBe('attachment;');
		});
	});

	describe('[POST] /courses/import', () => {
		const setup = async () => {
			const teacher = createTeacher();
			const course = await readFile(
				'./apps/server/src/modules/common-cartridge/testing/assets/us_history_since_1877.imscc'
			);
			const courseFileName = 'us_history_since_1877.imscc';

			await em.persistAndFlush([teacher.account, teacher.user]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacher.account);

			return { loggedInClient, course, courseFileName };
		};

		it('should import course', async () => {
			const { loggedInClient, course, courseFileName } = await setup();

			const response = await loggedInClient.postWithAttachment('import', 'file', course, courseFileName);

			expect(response.statusCode).toEqual(201);
		});
	});

	describe('[POST] /courses/:courseId/stop-sync', () => {
		describe('when a course is synchronized', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const group = groupEntityFactory.buildWithId();
				const course = courseFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: group,
				});

				await em.persistAndFlush([teacher.account, teacher.user, course, group]);
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

				const result: CourseEntity = await em.findOneOrFail(CourseEntity, course.id);
				expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
				expect(result.syncedWithGroup).toBeUndefined();
			});
		});

		describe('when the user is unauthorized', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const group = groupEntityFactory.buildWithId();
				const course = courseFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: group,
				});

				await em.persistAndFlush([teacher.account, teacher.user, course, group]);
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
			const teacher = createTeacher();
			const course = courseFactory.buildWithId({
				teachers: [teacher.user],
				students: [],
			});

			return { course, teacher };
		};

		it('should return teacher course permissions', async () => {
			const { course, teacher } = setup();
			await em.persistAndFlush([teacher.account, teacher.user, course]);
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
				const teacher = createTeacher();
				const group = groupEntityFactory.buildWithId();
				const course = courseFactory.build({
					teachers: [teacher.user],
				});

				await em.persistAndFlush([teacher.account, teacher.user, course, group]);
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

		describe('when a course is already synchronized', () => {
			const setup = async () => {
				const teacher = createTeacher();
				const group = groupEntityFactory.buildWithId();
				const otherGroup = groupEntityFactory.buildWithId();
				const course = courseFactory.build({
					teachers: [teacher.user],
					syncedWithGroup: otherGroup,
				});

				await em.persistAndFlush([teacher.account, teacher.user, course, group]);
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
				const teacher = createTeacher();
				const group = groupEntityFactory.buildWithId();
				const course = courseFactory.build({
					teachers: [teacher.user],
				});

				await em.persistAndFlush([teacher.account, teacher.user, course, group]);
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
			const teacher = createTeacher();
			const course = courseFactory.buildWithId({
				teachers: [teacher.user],
				students: [],
			});

			await em.persistAndFlush([teacher.account, teacher.user, course]);
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

	describe('[GET] /courses/all', () => {
		describe('when logged in as admin', () => {
			const setup = async () => {
				const student = createStudent();
				const teacher = createTeacher();
				const admin = createAdmin();
				const school = schoolEntityFactory.buildWithId({});

				const currentCourses: CourseEntity[] = courseFactory.buildList(5, {
					school,
				});
				const archivedCourses: CourseEntity[] = courseFactory.buildList(10, {
					school,
					untilDate: new Date('2024-07-31T23:59:59'),
				});

				admin.user.school = school;
				await em.persistAndFlush(school);
				await em.persistAndFlush([...currentCourses, ...archivedCourses]);
				await em.persistAndFlush([admin.account, admin.user]);
				em.clear();

				return {
					student,
					currentCourses,
					archivedCourses,
					teacher,
					admin,
					school,
				};
			};

			it('should return the correct response structure', async () => {
				const { admin } = await setup();
				const query = {};

				const loggedInClient = await testApiClient.login(admin.account);
				const response = await loggedInClient.get('/all').query(query);

				expect(response.statusCode).toBe(200);
				expect(response.body).toHaveProperty('data');
				expect(response.body).toHaveProperty('skip');
				expect(response.body).toHaveProperty('limit');
				expect(response.body).toHaveProperty('total');
			});

			it('should return archived courses in pages', async () => {
				const { admin } = await setup();
				const query = { skip: 0, limit: 10, sortBy: CourseSortQueryType.NAME, type: CourseStatusQueryType.ARCHIVE };

				const loggedInClient = await testApiClient.login(admin.account);
				const response = await loggedInClient.get('/all').query(query);

				const { total, skip, limit, data } = response.body as CourseListResponse;
				expect(response.statusCode).toBe(200);
				expect(skip).toBe(0);
				expect(limit).toBe(10);
				expect(total).toBe(10);
				expect(data.length).toBe(10);
			});

			it('should return current courses in pages', async () => {
				const { admin, currentCourses } = await setup();
				const query = { skip: 4, limit: 2, sortBy: CourseSortQueryType.NAME, type: CourseStatusQueryType.CURRENT };

				const loggedInClient = await testApiClient.login(admin.account);
				const response = await loggedInClient.get('/all').query(query);

				const { total, skip, limit, data } = response.body as CourseListResponse;
				expect(response.statusCode).toBe(200);
				expect(skip).toBe(4);
				expect(limit).toBe(2);
				expect(total).toBe(1);
				expect(data.length).toBe(1);
				expect(data[0].id).toBe(currentCourses[4].id);
			});
		});

		describe('when logged in not authenticated/authorized', () => {
			const setup = async () => {
				const teacher = createTeacher();

				await em.persistAndFlush([teacher.account, teacher.user]);
				em.clear();

				return {
					teacher,
				};
			};

			it('should return unauthorized', async () => {
				const query = { skip: 4, limit: 2, sortBy: CourseSortQueryType.NAME, type: CourseStatusQueryType.CURRENT };

				const response = await testApiClient.get('/all').query(query);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					code: HttpStatus.UNAUTHORIZED,
					message: 'Unauthorized',
					title: 'Unauthorized',
					type: 'UNAUTHORIZED',
				});
			});

			it('should return forbidden', async () => {
				const { teacher } = await setup();
				const query = { skip: 4, limit: 2, sortBy: CourseSortQueryType.NAME, type: CourseStatusQueryType.CURRENT };

				const loggedInClient = await testApiClient.login(teacher.account);
				const response = await loggedInClient.get('/all').query(query);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});
	});
});

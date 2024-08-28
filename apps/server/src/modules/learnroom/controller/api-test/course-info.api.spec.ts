import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Course as CourseEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	schoolEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { CourseSortQueryType, CourseStatusQueryType } from '../../domain';
import { CourseInfoListResponse } from '../dto/response';

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

describe('Course Info Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'course-info');
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	describe('[GET] /course-info', () => {
		describe('when logged in as admin', () => {
			const setup = async () => {
				const student = createStudent();
				const teacher = createTeacher();
				const admin = createAdmin();
				const school = schoolEntityFactory.buildWithId({});

				const currentCourses: CourseEntity[] = courseFactory.buildList(5, {
					school,
					untilDate: new Date('2045-07-31T23:59:59'),
				});
				const archivedCourses: CourseEntity[] = courseFactory.buildList(10, {
					school,
					untilDate: new Date('2024-07-31T23:59:59'),
				});

				admin.user.school = school;
				await em.persistAndFlush(school);
				await em.persistAndFlush(currentCourses);
				await em.persistAndFlush(archivedCourses);
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
				const response = await loggedInClient.get().query(query);

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
				const response = await loggedInClient.get().query(query);

				const { total, skip, limit, data } = response.body as CourseInfoListResponse;
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
				const response = await loggedInClient.get().query(query);

				const { total, skip, limit, data } = response.body as CourseInfoListResponse;
				expect(response.statusCode).toBe(200);
				expect(skip).toBe(4);
				expect(limit).toBe(2);
				expect(total).toBe(5);
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

				const response = await testApiClient.get().query(query);

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
				const response = await loggedInClient.get().query(query);

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

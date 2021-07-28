import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { Course } from '../entity';
import { CourseRepo } from './course.repo';

describe('user repo', () => {
	let module: TestingModule;
	let repo: CourseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course],
				}),
			],
			providers: [CourseRepo],
		}).compile();
		repo = module.get(CourseRepo);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Course, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getCourseOfUser).toEqual('function');
	});

	describe('getCourseOfUser', () => {
		it('should return right keys', async () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ studentIds: [userId], schoolId, name: '' });

			const expectedResult = [
				'_id',
				'classIds',
				'color',
				'createdAt',
				'description',
				'features',
				'name',
				'schoolId',
				'substitutionTeacherIds',
				'teacherIds',
				'updatedAt',
				'studentIds',
			].sort();

			await em.persistAndFlush([course]);
			const [result] = await repo.getCourseOfUser(userId);

			const keysOfFirstElements = Object.keys(result[0]).sort();

			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return course of teachers', async () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ teacherIds: [userId], schoolId, name: '' });
			const courses = [course];

			const expectedResult = [courses, 1];

			await em.persistAndFlush(courses);
			const result = await repo.getCourseOfUser(userId);

			expect(result).toEqual(expectedResult);
		});

		it('should return course of students', async () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ studentIds: [userId], schoolId, name: '' });
			const courses = [course];

			const expectedResult = [courses, 1];

			await em.persistAndFlush(courses);
			const result = await repo.getCourseOfUser(userId);

			expect(result).toEqual(expectedResult);
		});

		it('should return course of substitution teachers', async () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ substitutionTeacherIds: [userId], schoolId, name: '' });
			const courses = [course];

			const expectedResult = [courses, 1];

			await em.persistAndFlush(courses);
			const result = await repo.getCourseOfUser(userId);

			expect(result).toEqual(expectedResult);
		});

		it('should only return courses where the user is a member of it', async () => {
			const userId = new ObjectId().toHexString();
			const otherUserId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();

			const courseSubstitionTeacher = new Course({ substitutionTeacherIds: [userId], schoolId, name: '' });
			const courseTeacher = new Course({ teacherIds: [userId], schoolId, name: '' });
			const courseStudent = new Course({ studentIds: [userId], schoolId, name: '' });

			const otherCourseSubstitionTeacher = new Course({ substitutionTeacherIds: [otherUserId], schoolId, name: '' });
			const otherCourseTeacher = new Course({ teacherIds: [otherUserId], schoolId, name: '' });
			const otherCourseStudent = new Course({ studentIds: [otherUserId], schoolId, name: '' });

			const courses = [courseSubstitionTeacher, courseTeacher, courseStudent];
			const otherCourses = [otherCourseSubstitionTeacher, otherCourseTeacher, otherCourseStudent];

			const expectedResult = [courses, 3];

			await em.persistAndFlush([...courses, ...otherCourses]);
			const result = await repo.getCourseOfUser(userId);

			expect(result).toEqual(expectedResult);
		});
	});
});

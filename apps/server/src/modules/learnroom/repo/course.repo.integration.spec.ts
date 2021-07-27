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
			const course = new Course({ userIds: [userId], schoolId, name: '' });

			const expectedResult = [
				'_id',
				'classIds',
				'color',
				'createdAt',
				'description',
				'features',
				'name',
				'schoolId',
				'substitutionIds',
				'teacherIds',
				'updatedAt',
				'userIds',
			].sort();

			await em.persistAndFlush([course]);
			const [result] = await repo.getCourseOfUser(userId);

			const keysOfFirstElements = Object.keys(result[0]).sort();

			expect(keysOfFirstElements).toEqual(expectedResult);
		});
	});
});

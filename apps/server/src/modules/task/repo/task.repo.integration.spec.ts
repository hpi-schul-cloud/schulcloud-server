import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationQuery } from '@shared/controller/dto/pagination.query';
import { MongoMemoryDatabaseModule } from '../../database';
import { TaskRepo, FilterOptions } from './task.repo';
import { Submission, Task, UserTaskInfo, FileTaskInfo, LessonTaskInfo } from '../entity';

const getHex = () => new ObjectId().toHexString();

describe('TaskRepo', () => {
	let module: TestingModule;
	let repo: TaskRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Submission, Task, UserTaskInfo, FileTaskInfo, LessonTaskInfo],
				}),
			],
			providers: [TaskRepo],
		}).compile();
		repo = module.get(TaskRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Submission, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.getOpenTaskByCourseListAndLessonList).toBe('function');
	});

	describe('getOpenTaskByCourseListAndLessonList', () => {
		it('should return task of passed lessonIds and courseIds', async () => {
			const schoolId = getHex();
			const taskCourseIds = [getHex(), getHex(), getHex()];
			const lessonCourseIds = [getHex(), getHex(), getHex()];

			const tasks = [
				em.create(Task, { schoolId, courseId: taskCourseIds[0], private: false }),
				em.create(Task, { schoolId, courseId: taskCourseIds[1], private: false }),
				em.create(Task, { schoolId, courseId: taskCourseIds[2], private: true }),
				em.create(Task, { schoolId, lessonId: lessonCourseIds[0], private: false }),
				em.create(Task, { schoolId, lessonId: lessonCourseIds[1], private: false }),
				em.create(Task, { schoolId, lessonId: lessonCourseIds[2], private: true }),
			];

			await em.persistAndFlush([...tasks]);
			const ressourceIds = [...taskCourseIds, ...lessonCourseIds];

			const filteredOptions = new FilterOptions(new PaginationQuery(), new Date(), schoolId);
			const [result, total] = await repo.getOpenTaskByCourseListAndLessonList(ressourceIds, filteredOptions);
			// really i have no idea how many should return in our use case :P
			expect(total).toEqual(5);
		});

		it.todo('date');

		it.todo('should return right keys');

		it.todo('should return paginated result if pagination is passed as parameter.');
	});
});

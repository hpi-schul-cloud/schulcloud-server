import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, taskFactory, userFactory, setupEntities } from '@shared/testing';
import { Course, EntityId } from '@shared/domain';
import { CourseRepo, TaskRepo } from '@shared/repo';
import { RoomsUc, Board } from './rooms.uc';
import { MongoMemoryDatabaseModule } from '../../../shared/infra/database';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: CourseRepo;
	let taskRepo: TaskRepo;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsUc,
				{
					provide: CourseRepo,
					useValue: {
						findOne(courseId: EntityId, userId?: EntityId): Promise<Course> {
							throw new Error('Please write a mock for CourseRepo.findOne');
						},
					},
				},
				{
					provide: TaskRepo,
					useValue: {
						findAllByParentIds() {
							throw new Error('Please write a mock for TaskRepo.findAllByParentIds');
						},
					},
				},
			],
		}).compile();

		uc = module.get(RoomsUc);
		courseRepo = module.get(CourseRepo);
		taskRepo = module.get(TaskRepo);
	});

	describe('getBoard', () => {
		it('should get course for roomId', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const task = taskFactory.finished(user).buildWithId({ course });

			const spy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			jest.spyOn(taskRepo, 'findAllByParentIds').mockImplementation(() => Promise.resolve([[task], 1]));

			await uc.getBoard(course.id, 'userId');
			expect(spy).toHaveBeenCalledWith(course.id, 'userId');
		});

		it('should get tasks for courseId', async () => {
			const course = courseFactory.buildWithId();
			jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));

			const task = taskFactory.buildWithId({ course });
			const spy = jest.spyOn(taskRepo, 'findAllByParentIds').mockImplementation(() => Promise.resolve([[task], 1]));

			await uc.getBoard(course.id, 'userId');
			expect(spy).toHaveBeenCalledWith({ courseIds: [course.id] });
		});

		it('should return board with tasks', async () => {
			const course = courseFactory.buildWithId();
			jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));

			const task = taskFactory.buildWithId({ course });
			jest.spyOn(taskRepo, 'findAllByParentIds').mockImplementation(() => Promise.resolve([[task], 1]));

			const result = await uc.getBoard(course.id, 'userId');

			expect(result.elements.length).toEqual(1);
		});
	});
});

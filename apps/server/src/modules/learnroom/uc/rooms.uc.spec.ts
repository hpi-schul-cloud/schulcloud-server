import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, taskFactory, userFactory, setupEntities } from '@shared/testing';
import { Course, EntityId } from '@shared/domain';
import { CourseRepo, TaskRepo, UserRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { RoomsUc } from './rooms.uc';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: CourseRepo;
	let taskRepo: TaskRepo;
	let userRepo: UserRepo;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [],
			providers: [
				RoomsUc,
				{
					provide: CourseRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findOne(courseId: EntityId, userId?: EntityId): Promise<Course> {
							throw new Error('Please write a mock for CourseRepo.findOne');
						},
					},
				},
				{
					provide: TaskRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findBySingleParent(courseId: EntityId) {
							throw new Error('Please write a mock for TaskRepo.findBySingleParent');
						},
					},
				},
				{
					provide: UserRepo,
					useValue: {
						findById() {
							throw new Error('Please write a mock for UserRepo.findById');
						},
					},
				},
			],
		}).compile();

		uc = module.get(RoomsUc);
		courseRepo = module.get(CourseRepo);
		taskRepo = module.get(TaskRepo);
		userRepo = module.get(UserRepo);
	});

	describe('getBoard', () => {
		it('should get course for roomId', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const task = taskFactory.finished(user).buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			await uc.getBoard(course.id, user.id);
			expect(courseSpy).toHaveBeenCalledWith(course.id, user.id);

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});

		it('should exclude drafts for students', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ students: [user] });
			const task = taskFactory.buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			await uc.getBoard(course.id, user.id);
			expect(taskSpy).toHaveBeenCalledWith(course.id, { draft: false });

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});

		it('should not exclude drafts for teachers', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const task = taskFactory.buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			await uc.getBoard(course.id, user.id);
			expect(taskSpy).toHaveBeenCalledWith(course.id, {});

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});

		it('should return board with tasks for teacher', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ teachers: [user] });
			const task = taskFactory.buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			const result = await uc.getBoard(course.id, user.id);
			expect(result.elements.length).toEqual(1);

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});

		it('should return board with tasks for students', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ students: [user] });
			const task = taskFactory.buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			const result = await uc.getBoard(course.id, user.id);
			expect(result.elements.length).toEqual(1);

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});

		it('should return board with tasks for substitution teacher', async () => {
			const user = userFactory.build();
			const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
			const task = taskFactory.buildWithId({ course });

			const courseSpy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));
			const taskSpy = jest.spyOn(taskRepo, 'findBySingleParent').mockImplementation(() => Promise.resolve([[task], 1]));
			const userSpy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			const result = await uc.getBoard(course.id, user.id);
			expect(result.elements.length).toEqual(1);

			courseSpy.mockRestore();
			taskSpy.mockRestore();
			userSpy.mockRestore();
		});
	});
});

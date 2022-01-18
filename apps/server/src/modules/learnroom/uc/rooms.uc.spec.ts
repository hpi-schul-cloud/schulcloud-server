import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, taskFactory, userFactory, setupEntities } from '@shared/testing';
import { Course, EntityId, Task, User } from '@shared/domain';
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

	const setCourseRepoMock = {
		findOne: (course: Course) => {
			const spy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));

			return spy;
		},
	};

	const setTaskRepoMock = {
		findBySingleParent: (tasks: Task[]) => {
			const spy = jest
				.spyOn(taskRepo, 'findBySingleParent')
				.mockImplementation(() => Promise.resolve([tasks, tasks.length]));

			return spy;
		},
	};

	const setUserRepoMock = {
		findById: (user: User) => {
			const spy = jest.spyOn(userRepo, 'findById').mockImplementation(() => Promise.resolve(user));

			return spy;
		},
	};

	describe('getBoard', () => {
		const setAllMocks = (user: User, course: Course, tasks: Task[]) => {
			const userSpy = setUserRepoMock.findById(user);
			const courseSpy = setCourseRepoMock.findOne(course);
			const taskSpy = setTaskRepoMock.findBySingleParent(tasks);

			const mockRestore = () => {
				courseSpy.mockRestore();
				taskSpy.mockRestore();
				userSpy.mockRestore();
			};

			return { mockRestore, userSpy, courseSpy, taskSpy };
		};

		describe('when user in course is a teacher', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.buildWithId({ teachers: [user] });

				return { user, course };
			};

			it('should get course for roomId', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				const { mockRestore, courseSpy } = setAllMocks(user, course, [task]);

				await uc.getBoard(course.id, user.id);
				expect(courseSpy).toHaveBeenCalledWith(course.id, user.id);

				mockRestore();
			});

			it('should not exclude drafts', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [task]);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(course.id, {});

				mockRestore();
			});

			it('should return board with tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(1);

				mockRestore();
			});
		});

		describe('when user in course is a students', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.buildWithId({ students: [user] });

				return { user, course };
			};

			it('should exclude drafts', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [task]);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(course.id, { draft: false });

				mockRestore();
			});

			it('should return board with tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(1);

				mockRestore();
			});
		});

		describe('when user in course is a substitution teacher', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });

				return { user, course };
			};

			it('should return board with tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(1);

				mockRestore();
			});
		});
	});
});

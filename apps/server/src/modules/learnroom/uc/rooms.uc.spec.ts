import { Test, TestingModule } from '@nestjs/testing';
import { courseFactory, lessonFactory, taskFactory, userFactory, setupEntities } from '@shared/testing';
import { Course, EntityId, Lesson, Task, User } from '@shared/domain';
import { CourseRepo, LessonRepo, TaskRepo, UserRepo } from '@shared/repo';
import { MikroORM } from '@mikro-orm/core';
import { RoomsUc } from './rooms.uc';

describe('rooms usecase', () => {
	let uc: RoomsUc;
	let courseRepo: CourseRepo;
	let lessonRepo: LessonRepo;
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
					provide: LessonRepo,
					useValue: {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAllByCourseIds(courseIds: EntityId[]) {
							throw new Error('Please write a mock for LessonRepo.findAllByCourseIds');
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
		lessonRepo = module.get(LessonRepo);
		taskRepo = module.get(TaskRepo);
		userRepo = module.get(UserRepo);
	});

	const setCourseRepoMock = {
		findOne: (course: Course) => {
			const spy = jest.spyOn(courseRepo, 'findOne').mockImplementation(() => Promise.resolve(course));

			return spy;
		},
	};

	const setLessonRepoMock = {
		findAllByCourseIds: (lessons: Lesson[]) => {
			const spy = jest
				.spyOn(lessonRepo, 'findAllByCourseIds')
				.mockImplementation(() => Promise.resolve([lessons, lessons.length]));

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
		const setAllMocks = (user: User, course: Course, lessons: Lesson[], tasks: Task[]) => {
			const userSpy = setUserRepoMock.findById(user);
			const courseSpy = setCourseRepoMock.findOne(course);
			const lessonSpy = setLessonRepoMock.findAllByCourseIds(lessons);
			const taskSpy = setTaskRepoMock.findBySingleParent(tasks);

			const mockRestore = () => {
				courseSpy.mockRestore();
				lessonSpy.mockRestore();
				taskSpy.mockRestore();
				userSpy.mockRestore();
			};

			return { mockRestore, userSpy, courseSpy, lessonSpy, taskSpy };
		};

		describe('when user in course is a teacher', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });

				return { user, course };
			};

			it('should get course for roomId', async () => {
				const { user, course } = setup();
				taskFactory.finished(user).build({ course });
				lessonFactory.build({ course });

				const { mockRestore, courseSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(courseSpy).toHaveBeenCalledWith(course.id, user.id);

				mockRestore();
			});

			it('should not exclude drafts', async () => {
				const { user, course } = setup();
				taskFactory.build({ course, private: true });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(user.id, course.id, { draft: true });

				mockRestore();
			});

			it('should show future tasks', async () => {
				const { user, course } = setup();
				const threeWeeksinMilliseconds = 1.814e9;
				taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(user.id, course.id, { draft: true });

				mockRestore();
			});

			it('should show lessons', async () => {
				const { user, course } = setup();
				lessonFactory.build({ course });

				const { mockRestore, lessonSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(lessonSpy).toHaveBeenCalledWith([course.id], {});

				mockRestore();
			});

			it('should also show hidden lessons', async () => {
				const { user, course } = setup();
				lessonFactory.build({ course, hidden: true });

				const { mockRestore, lessonSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(lessonSpy).toHaveBeenCalledWith([course.id], {});

				mockRestore();
			});

			it('should return board with tasks and lessons', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });
				const lesson = lessonFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [lesson], [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(2);

				mockRestore();
			});
		});

		describe('when user in course is a student', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ students: [user] });

				return { user, course };
			};

			it('should exclude drafts', async () => {
				const { user, course } = setup();
				taskFactory.build({ course, private: true });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(user.id, course.id, { draft: false, noFutureAvailableDate: true });

				mockRestore();
			});

			it('should not show future tasks', async () => {
				const { user, course } = setup();
				const threeWeeksinMilliseconds = 1.814e9;
				taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				const { mockRestore, taskSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(taskSpy).toHaveBeenCalledWith(user.id, course.id, { draft: false, noFutureAvailableDate: true });

				mockRestore();
			});

			it('should show lessons', async () => {
				const { user, course } = setup();
				lessonFactory.build({ course });

				const { mockRestore, lessonSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(lessonSpy).toHaveBeenCalledWith([course.id], { hidden: false });

				mockRestore();
			});

			it('should not show hidden lessons', async () => {
				const { user, course } = setup();
				lessonFactory.build({ course, hidden: true });

				const { mockRestore, lessonSpy } = setAllMocks(user, course, [], []);

				await uc.getBoard(course.id, user.id);
				expect(lessonSpy).toHaveBeenCalledWith([course.id], { hidden: false });

				mockRestore();
			});

			it('should return board with tasks and lessons', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });
				const lesson = lessonFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [lesson], [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(2);

				mockRestore();
			});
		});

		describe('when user in course is a substitution teacher', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });

				return { user, course };
			};

			it('should return board with tasks and lessons', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });
				const lesson = lessonFactory.build({ course });

				const { mockRestore } = setAllMocks(user, course, [lesson], [task]);

				const result = await uc.getBoard(course.id, user.id);
				expect(result.elements.length).toEqual(2);

				mockRestore();
			});
		});
	});
});

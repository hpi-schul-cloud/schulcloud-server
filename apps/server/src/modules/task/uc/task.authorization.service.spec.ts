import { Test, TestingModule } from '@nestjs/testing';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { taskFactory, courseFactory, userFactory } from '@shared/testing';
import { Course, Lesson } from '@shared/domain';

import { TaskAuthorizationService, TaskParentPermission } from './task.authorization.service';

describe('task.authorization.service', () => {
	let module: TestingModule;
	let service: TaskAuthorizationService;
	let courseRepo: CourseRepo;
	let lessonRepo: LessonRepo;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				TaskAuthorizationService,
				{
					provide: LessonRepo,
					useValue: {
						findAllByCourseIds() {
							throw new Error('Please write a mock for LessonRepo.findAllByCourseIds');
						},
					},
				},
				{
					provide: CourseRepo,
					useValue: {
						findAllForTeacher() {
							throw new Error('Please write a mock for TaskRepo.findAllForTeacher');
						},
						findAllByUserId() {
							throw new Error('Please write a mock for TaskRepo.findAllByUserId');
						},
					},
				},
			],
		}).compile();

		service = module.get(TaskAuthorizationService);
		courseRepo = module.get(CourseRepo);
		lessonRepo = module.get(LessonRepo);
	});

	const setCourseRepoMock = {
		findAllForTeacher: (courses: Course[] = []) => {
			const spy = jest
				.spyOn(courseRepo, 'findAllForTeacher')
				.mockImplementation(() => Promise.resolve([courses, courses.length]));

			return spy;
		},
		findAllByUserId: (courses: Course[] = []) => {
			const spy = jest
				.spyOn(courseRepo, 'findAllByUserId')
				.mockImplementation(() => Promise.resolve([courses, courses.length]));

			return spy;
		},
	};

	const setLessonRepoMock = {
		findAllByCourseIds: (lessons: Lesson[] = []) => {
			const spy = jest
				.spyOn(lessonRepo, 'findAllByCourseIds')
				.mockImplementation(() => Promise.resolve([lessons, lessons.length]));

			return spy;
		},
	};

	describe('hasTaskPermission', () => {
		describe('when testing read permission', () => {
			it('should true if it is the creator', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should true if it is a student', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should true if it is a substitution teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});

			it('should true if it is a teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.read);

				expect(result).toBe(true);
			});
		});

		describe('when testing write permission', () => {
			it('should true if it is the creator', () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});

			it('should false if it is a student', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ students: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.write);

				expect(result).toBe(false);
			});

			it('should true if it is a substitution teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});

			it('should true if it is a teacher', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ teachers: [user] });
				const task = taskFactory.build({ course });

				const result = service.hasTaskPermission(user.id, task, TaskParentPermission.write);

				expect(result).toBe(true);
			});
		});
	});
});

import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseRoomsAuthorisationService } from './course-rooms.authorisation.service';

describe('rooms authorisation service', () => {
	let module: TestingModule;
	let service: CourseRoomsAuthorisationService;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CourseRoomsAuthorisationService],
		}).compile();

		service = module.get(CourseRoomsAuthorisationService);
		await setupEntities([User, CourseEntity, CourseGroupEntity, LessonEntity, Material, Task, Submission]);
	});

	describe('hasCourseReadPermission', () => {
		it('should be true for teacher', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ teachers: [user] });

			const result = service.hasCourseReadPermission(user, course);
			expect(result).toEqual(true);
		});

		it('should be true for substitutionTeacher', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });

			const result = service.hasCourseReadPermission(user, course);
			expect(result).toEqual(true);
		});

		it('should be true for student', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ students: [user] });

			const result = service.hasCourseReadPermission(user, course);
			expect(result).toEqual(true);
		});

		it('should be false for user not in course', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId();

			const result = service.hasCourseReadPermission(user, course);
			expect(result).toEqual(false);
		});
	});

	describe('hasCourseWritePermission', () => {
		it('should be true for teacher', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ teachers: [user] });

			const result = service.hasCourseWritePermission(user, course);
			expect(result).toEqual(true);
		});

		it('should be true for substitutionTeacher', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });

			const result = service.hasCourseWritePermission(user, course);
			expect(result).toEqual(true);
		});

		it('should be false for student', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId({ students: [user] });

			const result = service.hasCourseWritePermission(user, course);
			expect(result).toEqual(false);
		});

		it('should be false for user not in course', () => {
			const user = userFactory.buildWithId();
			const course = courseEntityFactory.buildWithId();

			const result = service.hasCourseReadPermission(user, course);
			expect(result).toEqual(false);
		});
	});

	describe('hasTaskReadPermission', () => {
		describe('when task has no course', () => {
			it('should be true for creator', () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user, course: undefined });

				const result = service.hasTaskReadPermission(user, task);
				expect(result).toEqual(true);
			});

			it('should be false for other users', () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ course: undefined });

				const result = service.hasTaskReadPermission(user, task);
				expect(result).toEqual(false);
			});
		});

		describe('when task belongs to course', () => {
			it('should be false for user not in course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });

				const result = service.hasTaskReadPermission(user, task);
				expect(result).toEqual(false);
			});

			describe('when task is private', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.draft().buildWithId({ creator: user, course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be false for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ students: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});
			});

			describe('when task is unpublished', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const futureDate = new Date(Date.now() + 10000);
					const task = taskFactory.buildWithId({ creator: user, course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const futureDate = new Date(Date.now() + 10000);
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
					const futureDate = new Date(Date.now() + 10000);
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be false for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ students: [user] });
					const futureDate = new Date(Date.now() + 10000);
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});
			});

			describe('when task is published', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const futureDate = new Date(Date.now() - 10000);
					const task = taskFactory.buildWithId({ creator: user, course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const futureDate = new Date(Date.now() - 10000);
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
					const futureDate = new Date(Date.now() - 10000);
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ students: [user] });
					const pastDate = new Date(Date.now() - 10000);
					const task = taskFactory.buildWithId({ course, availableDate: pastDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});
			});

			describe('when task has no publishDAte, and is not private', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.buildWithId({ creator: user, course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseEntityFactory.buildWithId({ students: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});
			});
		});

		describe('when task belongs to lesson', () => {
			it('is not implemented yet', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const task = taskFactory.buildWithId({ course, lesson });

				const call = () => service.hasTaskReadPermission(user, task);
				expect(call).toThrow(NotImplementedException);
			});
		});
	});

	describe('hasLessonReadPermission', () => {
		describe('when lesson is hidden', () => {
			it('should be true for teacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ teachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for substitutionTeacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be false for student of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ students: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});

			it('should be false for user outside course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});
		});

		describe('when lesson is visisble', () => {
			it('should be true for teacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ teachers: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for substitutionTeacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for student of course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId({ students: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be false for user outside course', () => {
				const user = userFactory.buildWithId();
				const course = courseEntityFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});
		});
	});
});

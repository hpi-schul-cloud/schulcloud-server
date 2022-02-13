import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { taskFactory, courseFactory, lessonFactory, userFactory, setupEntities } from '@shared/testing';
import { RoomsAuthorisationService } from './rooms.authorisation.service';

describe('rooms authorisation service', () => {
	let orm: MikroORM;
	let service: RoomsAuthorisationService;
	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [RoomsAuthorisationService],
		}).compile();

		service = module.get(RoomsAuthorisationService);
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
				const course = courseFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });

				const result = service.hasTaskReadPermission(user, task);
				expect(result).toEqual(false);
			});

			describe('when task is private', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.draft().buildWithId({ creator: user, course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be false for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});

				it('should be false for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});

				it('should be false for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ students: [user] });
					const task = taskFactory.draft().buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});
			});

			describe('when task is unpublished', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const futureDate = Date.now() + 10000;
					const task = taskFactory.buildWithId({ creator: user, course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const futureDate = Date.now() + 10000;
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
					const futureDate = Date.now() + 10000;
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be false for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ students: [user] });
					const futureDate = Date.now() + 10000;
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(false);
				});
			});

			describe('when task is published', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const futureDate = Date.now() - 10000;
					const task = taskFactory.buildWithId({ creator: user, course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const futureDate = Date.now() - 10000;
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
					const futureDate = Date.now() - 10000;
					const task = taskFactory.buildWithId({ course, availableDate: futureDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ students: [user] });
					const pastDate = Date.now() - 10000;
					const task = taskFactory.buildWithId({ course, availableDate: pastDate });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});
			});

			describe('when task has no publishDAte, and is not private', () => {
				it('should be true for creator', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.buildWithId({ creator: user, course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other teacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ teachers: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other substitutionTeacher', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});

				it('should be true for other student', () => {
					const user = userFactory.buildWithId();
					const course = courseFactory.buildWithId({ students: [user] });
					const task = taskFactory.buildWithId({ course });

					const result = service.hasTaskReadPermission(user, task);
					expect(result).toEqual(true);
				});
			});
		});

		describe('when task belongs to lesson', () => {
			it('is not implemented yet', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
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
				const course = courseFactory.buildWithId({ teachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for substitutionTeacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be false for student of course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ students: [user] });
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});

			it('should be false for user outside course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course, hidden: true });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});
		});

		describe('when lesson is visisble', () => {
			it('should be true for teacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ teachers: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for substitutionTeacher of course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be true for student of course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ students: [user] });
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(true);
			});

			it('should be false for user outside course', () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId();
				const lesson = lessonFactory.buildWithId({ course });

				const result = service.hasLessonReadPermission(user, lesson);
				expect(result).toEqual(false);
			});
		});
	});
});

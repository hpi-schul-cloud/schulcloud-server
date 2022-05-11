import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { courseFactory, lessonFactory, setupEntities, taskFactory } from '../../testing';
import { Task } from './task.entity';

describe('Lesson Entity', () => {
	let orm: MikroORM;
	const inOneDay = new Date(Date.now() + 8.64e7);

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('numberOfPublishedTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfPublishedTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of public tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(2);
			});

			it('should not count private tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(1);
			});

			it('should not count planned tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('numberOfDraftTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfDraftTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of draft tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(2);
			});

			it('should not count published tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(1);
			});

			it('should not count planned tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('numberOfPlannedTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfPlannedTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of planned tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(2);
			});

			it('should not count published tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(1);
			});

			it('should not count draft tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });
				taskFactory.build({ course, lesson, private: true, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('publish', () => {
		it('should become visible', () => {
			const lesson = lessonFactory.build({ hidden: true });
			lesson.publish();
			expect(lesson.hidden).toEqual(false);
		});
	});

	describe('unpublish', () => {
		it('should become hidden', () => {
			const lesson = lessonFactory.build({ hidden: false });
			lesson.unpublish();
			expect(lesson.hidden).toEqual(true);
		});
	});
});

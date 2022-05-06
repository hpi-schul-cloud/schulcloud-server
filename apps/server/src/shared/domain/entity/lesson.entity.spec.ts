import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from 'bson';
import { setupEntities, lessonFactory, taskFactory, courseFactory } from '../../testing';
import { Task } from './task.entity';

describe('Lesson Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('numberOfTasksForStudent', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfTasksForStudent()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of public tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson });

				const result = lesson.getNumberOfTasksForStudent();
				expect(result).toEqual(2);
			});

			it('should not count private tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfTasksForStudent();
				expect(result).toEqual(1);
			});
		});
	});

	describe('numberOfTasksForTeacher', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfTasksForTeacher()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should count public tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson });

				const result = lesson.getNumberOfTasksForTeacher();
				expect(result).toEqual(2);
			});

			it('should count private tasks', () => {
				const course = courseFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfTasksForTeacher();
				expect(result).toEqual(2);
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

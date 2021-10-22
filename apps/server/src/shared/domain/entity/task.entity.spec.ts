import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { Task } from './task.entity';
import { courseFactory } from '../factory';
import { Lesson } from './lesson.entity';

describe('Task Entity', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({ imports: [MongoMemoryDatabaseModule.forRoot()] }).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('isDraft', () => {
		it('should return true by default', () => {
			const task = new Task({ name: 'task #1' });
			expect(task.isDraft()).toEqual(true);
		});

		it('should return false if private = false', () => {
			const task = new Task({ name: 'task #1', private: false });
			expect(task.isDraft()).toEqual(false);
		});

		it('should return private property as boolean if defined', () => {
			const task = new Task({ name: 'task #1', private: true });
			expect(task.isDraft()).toEqual(true);
		});

		it('should return private property as boolean if undefined', () => {
			const task = new Task({ name: 'task #1' });
			Object.assign(task, { private: undefined });
			expect(task.isDraft()).toEqual(false);
		});
	});

	describe('getDescriptions', () => {
		describe('when a course is set', () => {
			it('should return the name and color of the course', () => {
				const course = courseFactory.build();
				const task = new Task({ name: 'task #1', course });
				expect(task.getDescriptions().name).toEqual(course.name);
				expect(task.getDescriptions().color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.build();
					const lesson = new Lesson({ name: 'lesson #1', course });
					const task = new Task({ name: 'task #1', course, lesson });
					expect(task.getDescriptions().description).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.build();
					const task = new Task({ name: 'task #1', course });
					expect(task.getDescriptions().description).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = new Task({ name: 'task #1' });
				expect(task.getDescriptions().name).toEqual('');
				expect(task.getDescriptions().color).toEqual('#ACACAC');
			});
		});
	});
});

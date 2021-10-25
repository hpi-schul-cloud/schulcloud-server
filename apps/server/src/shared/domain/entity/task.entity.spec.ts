import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { courseFactory, lessonFactory, taskFactory } from '../factory';

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
			const task = taskFactory.build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return false if private = false', () => {
			const task = taskFactory.draft(false).build();
			expect(task.isDraft()).toEqual(false);
		});

		it('should return private property as boolean if defined', () => {
			const task = taskFactory.build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return private property as boolean if undefined', () => {
			const task = taskFactory.build();
			Object.assign(task, { private: undefined });
			expect(task.isDraft()).toEqual(false);
		});
	});

	describe('getDescriptions', () => {
		describe('when a course is set', () => {
			it('should return the name and color of the course', () => {
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				expect(task.getDescriptions().name).toEqual(course.name);
				expect(task.getDescriptions().color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.build();
					const lesson = lessonFactory.build({ course });
					const task = taskFactory.build({ course, lesson });
					expect(task.getDescriptions().description).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.build();
					const task = taskFactory.build({ course });
					expect(task.getDescriptions().description).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = taskFactory.build();
				expect(task.getDescriptions().name).toEqual('');
				expect(task.getDescriptions().color).toEqual('#ACACAC');
			});
		});
	});
});

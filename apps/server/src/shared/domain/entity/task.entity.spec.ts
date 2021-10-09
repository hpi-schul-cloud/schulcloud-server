import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { Task } from './task.entity';
import { courseFactory } from '../factory';

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
		it('should return the descriptions of the parent if set', () => {
			const course = courseFactory.build();
			const task = new Task({ name: 'task #1', parent: course });
			expect(task.getDescriptions()).toEqual(course.getDescriptions());
		});

		it('should return defaults if the parent is not set', () => {
			const task = new Task({ name: 'task #1' });
			expect(task.getDescriptions()).toEqual({
				name: '',
				description: '',
				color: '#ACACAC',
			});
		});
	});
});

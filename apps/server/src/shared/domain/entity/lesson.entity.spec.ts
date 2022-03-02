import { MikroORM } from '@mikro-orm/core';
import { setupEntities, lessonFactory } from '../../testing';

describe('Lesson Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
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

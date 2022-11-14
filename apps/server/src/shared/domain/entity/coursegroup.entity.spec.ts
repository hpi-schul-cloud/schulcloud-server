import { MikroORM } from '@mikro-orm/core';
import { courseFactory, setupEntities } from '@shared/testing';
import { CourseGroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error if constructor is called without arguments', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroup();

			expect(test).toThrow();
		});

		it('should create a courseGroup when passing required properties', () => {
			const name = 'someName';
			const course = courseFactory.build();

			const courseGroup = new CourseGroup({ name, course });

			expect(courseGroup instanceof CourseGroup).toEqual(true);
		});
	});
});

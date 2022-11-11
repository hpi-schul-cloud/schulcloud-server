import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
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
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroup();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const course = courseFactory.build();
			course._id = new ObjectId();
			const courseGroup = new CourseGroup({ course });
			expect(courseGroup instanceof CourseGroup).toEqual(true);
		});
	});
});

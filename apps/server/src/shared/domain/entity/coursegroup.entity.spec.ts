import { ObjectId } from '@mikro-orm/mongodb';
import { courseFactory, setupEntities } from '@shared/testing';
import { CourseGroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	beforeAll(async () => {
		await setupEntities();
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

	// TODO check if and how we need this
	describe('getParent', () => {
		it('should return the right id.', () => {
			const course = courseFactory.build();
			course._id = new ObjectId();
			const courseGroup = new CourseGroup({ course });

			const result = courseGroup.getParentId();
			expect(result).toEqual(course._id);
		});
	});
});

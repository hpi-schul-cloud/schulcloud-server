import { ObjectId } from '@mikro-orm/mongodb';
import { CourseGroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroup();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const courseId = new ObjectId();
			const courseGroup = new CourseGroup({ courseId });
			expect(courseGroup instanceof CourseGroup).toEqual(true);
		});
	});

	describe('getParent', () => {
		it('should return the right id.', () => {
			const courseId = new ObjectId();
			const courseGroup = new CourseGroup({ courseId });

			const result = courseGroup.getParentId();
			expect(result).toEqual(courseId);
		});
	});
});

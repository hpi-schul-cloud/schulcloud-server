import { ObjectId } from '@mikro-orm/mongodb';
import { Coursegroup } from './coursegroup.entity';
import { Course } from './course.entity';

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Coursegroup();
			expect(test).toThrow();
		});

		it('should create a course by passing right properties', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });
			const coursegroup = new Coursegroup({ course });
			expect(coursegroup instanceof Coursegroup).toEqual(true);
		});
	});
});

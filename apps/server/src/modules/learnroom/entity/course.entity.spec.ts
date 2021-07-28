import { ObjectId } from '@mikro-orm/mongodb';
import { Course } from './course.entity';

describe('CourseEntity', () => {
	describe('getDescription', () => {
		it('should work with empty value', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });

			const result = course.getDescription();

			expect(result).toEqual('');
		});

		it('should work with existing value', () => {
			const description = '123';
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, description });

			const result = course.getDescription();

			expect(result).toEqual(description);
		});

		it('should work with invalid db result value', () => {
			const schoolId = new ObjectId().toHexString();
			const course = { name: '', schoolId } as Course;

			const result = course.getDescription();

			expect(result).toEqual('');
		});
	});
});

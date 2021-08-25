import { ObjectId } from '@mikro-orm/mongodb';
import { Coursegroup } from './coursegroup.entity';
// import { Course } from './course.entity';

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Coursegroup();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const courseId = new ObjectId().toHexString();
			const coursegroup = new Coursegroup({ courseId });
			expect(coursegroup instanceof Coursegroup).toEqual(true);
		});
	});

	describe('isMember', () => {
		it('should return false for empty members', () => {
			const courseId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const coursegroup = new Coursegroup({ courseId, studentIds: [] });

			const result = coursegroup.isMember(userId);
			expect(result).toBeFalsy();
		});

		it('should true if userId is member', () => {
			const courseId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const coursegroup = new Coursegroup({ courseId, studentIds: [userId] });

			const result = coursegroup.isMember(userId);
			expect(result).toBeTruthy();
		});

		it('should false if userId is not member of studentIds', () => {
			const courseId = new ObjectId().toHexString();
			const otherUserId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const coursegroup = new Coursegroup({ courseId, studentIds: [otherUserId] });

			const result = coursegroup.isMember(userId);
			expect(result).toBeFalsy();
		});
	});

	describe('getParent', () => {
		it('should return the right id.', () => {
			const courseId = new ObjectId().toHexString();
			const coursegroup = new Coursegroup({ courseId });

			const result = coursegroup.getParentId();
			expect(result).toEqual(courseId);
		});
	});
});

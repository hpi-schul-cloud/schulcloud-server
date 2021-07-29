import { ObjectId } from '@mikro-orm/mongodb';
import { ValidationError } from '@shared/common';
import { Lesson } from './lesson.entity';
import { Course } from './course.entity';
import { Coursegroup } from './coursegroup.entity';

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Lesson();
			expect(test).toThrow();
		});

		it('should create a lesson by passing course', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });
			const lesson = new Lesson({ name: '', course });
			expect(lesson instanceof Lesson).toEqual(true);
		});

		it('should create a lesson by passing coursegroup without course', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });
			const coursegroup = new Coursegroup({ course });
			const lesson = new Lesson({ name: '', coursegroup });
			expect(lesson instanceof Lesson).toEqual(true);
		});

		it('should create a lesson by passing coursegroup without course and coursegroup', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });
			const coursegroup = new Coursegroup({ course });
			const lesson = new Lesson({ name: '', coursegroup, course });
			expect(lesson instanceof Lesson).toEqual(true);
		});

		it('should throw an error by missing course', () => {
			// @ts-expect-error: Test case
			const test = () => new Lesson({ name: '', course: null });
			expect(test).toThrow(ValidationError);
		});

		it('should throw an error by missing course by passed coursegroup', () => {
			// @ts-expect-error: Test case
			const coursegroup = new Coursegroup({});

			const test = () => new Lesson({ name: '', coursegroup });
			expect(test).toThrow(ValidationError);
		});

		// TODO: why the id is not created by creating the entity
		it('should throw an error by passing coursegroup that are not part of course', () => {
			const schoolId = new ObjectId().toHexString();
			const courseId = new ObjectId().toHexString();
			const otherCourseId = new ObjectId().toHexString();

			const course = new Course({ name: '', schoolId });
			const otherCourse = new Course({ name: '', schoolId });
			const coursegroup = new Coursegroup({ course });

			course.id = courseId;
			otherCourse.id = otherCourseId;

			const test = () => new Lesson({ name: '', coursegroup, course: otherCourse });
			expect(test).toThrow(ValidationError);
		});
	});

	// describe('getCourse', () => {});
	// describe('getCoursegroup', () => {});
	// describe('getParent', () => {});
	// describe('isVisible', () => {});
	// describe('changeVisiblility', () => {})
});

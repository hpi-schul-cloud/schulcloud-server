import { ObjectId } from '@mikro-orm/mongodb';
import { courseFactory } from '../testing';
import { Course } from './course.do';

describe(Course.name, () => {
	describe('isTeacher', () => {
		describe('when the user is a teacher in the course', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const course = courseFactory.build({
					teacherIds: [userId],
				});

				return {
					course,
					userId,
				};
			};

			it('should return true', () => {
				const { course, userId } = setup();

				const result = course.isTeacher(userId);

				expect(result).toEqual(true);
			});
		});

		describe('when the user is not a teacher in the course', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const course = courseFactory.build({
					teacherIds: [new ObjectId().toHexString()],
					studentIds: [userId],
					substitutionTeacherIds: [userId],
				});

				return {
					course,
					userId,
				};
			};

			it('should return false', () => {
				const { course, userId } = setup();

				const result = course.isTeacher(userId);

				expect(result).toEqual(false);
			});
		});
	});
});

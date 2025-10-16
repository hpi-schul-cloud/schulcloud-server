import { FilterQuery } from '@mikro-orm/core';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { CourseEntity } from './course.entity';

export class CourseScope extends Scope<CourseEntity> {
	public forAllGroupTypes(userId: EntityId): this {
		const isStudent = { students: userId };
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	public forTeacherOrSubstituteTeacher(userId: EntityId): this {
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	public forTeacher(userId: EntityId): this {
		this.addQuery({ teachers: userId });
		return this;
	}

	public forActiveCourses(): this {
		const now = new Date();
		const noUntilDate = { untilDate: { $exists: false } } as FilterQuery<CourseEntity>;
		const untilDateInFuture = { untilDate: { $gte: now } };

		this.addQuery({ $or: [noUntilDate, untilDateInFuture] });

		return this;
	}

	public forCourseId(courseId: EntityId): this {
		this.addQuery({ id: courseId });
		return this;
	}

	public bySchoolId(schoolId: EntityId | undefined): this {
		if (schoolId) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	public withoutTeacher(): this {
		this.addQuery({ teachers: { $eq: [] } });
		return this;
	}

	public forArchivedCourses(): this {
		const now = new Date();
		const untilDateExists = { untilDate: { $exists: true } } as FilterQuery<CourseEntity>;
		const untilDateInPast = { untilDate: { $lt: now } };

		this.addQuery({ $and: [untilDateExists, untilDateInPast] });

		return this;
	}
}

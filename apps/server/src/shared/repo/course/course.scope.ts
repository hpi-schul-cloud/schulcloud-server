import { FilterQuery } from '@mikro-orm/core';

import { Course } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { Scope } from '../scope';

export class CourseScope extends Scope<Course> {
	forAllGroupTypes(userId: EntityId): this {
		const isStudent = { students: userId };
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	forTeacherOrSubstituteTeacher(userId: EntityId): this {
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	forTeacher(userId: EntityId): this {
		this.addQuery({ teachers: userId });
		return this;
	}

	forActiveCourses(): this {
		const now = new Date();
		const noUntilDate = { untilDate: { $exists: false } } as FilterQuery<Course>;
		const untilDateInFuture = { untilDate: { $gte: now } };

		this.addQuery({ $or: [noUntilDate, untilDateInFuture] });

		return this;
	}

	forCourseId(courseId: EntityId): this {
		this.addQuery({ id: courseId });
		return this;
	}

	bySchoolId(schoolId: EntityId | undefined): this {
		if (schoolId) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	forArchivedCourses(): this {
		const now = new Date();
		const untilDateExists = { untilDate: { $exists: true } } as FilterQuery<Course>;
		const untilDateInPast = { untilDate: { $lt: now } };

		this.addQuery({ $and: [untilDateExists, untilDateInPast] });

		return this;
	}
}

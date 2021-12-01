import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { QueryOrderMap } from '@mikro-orm/core';

import { EntityId, Course, Counted, IFindOptions } from '@shared/domain';
import { Scope } from '../scope';

class CourseScope extends Scope<Course> {
	forAllGroupTypes(userId: EntityId): CourseScope {
		const isStudent = { students: userId };
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	forTeacher(userId: EntityId): CourseScope {
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	forActiveCourses(): CourseScope {
		const now = new Date();
		const noUntilDate = { untilDate: { $exists: false } };
		const untilDateInFuture = { untilDate: { $gte: now } };

		this.addQuery({ $or: [noUntilDate, untilDateInFuture] });

		return this;
	}

	forArchivedCourses(): CourseScope {
		const now = new Date();

		this.addQuery({ untilDate: { $lt: now } });

		return this;
	}
}

@Injectable()
export class CourseRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByUserId(
		userId: EntityId,
		filters?: {
			onlyActiveCourses?: boolean;
			onlyArchivedCourses?: boolean;
		},
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}

		if (filters?.onlyArchivedCourses) {
			scope.forArchivedCourses();
		}

		const { pagination, order } = options || {};
		const queryOptions = {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap,
		};

		const [courses, count] = await this.em.findAndCount(Course, scope.query, queryOptions);

		return [courses, count];
	}

	// not tested in repo.integration.spec
	async findAllForTeacher(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forTeacher(userId);

		const [courses, count] = await this.em.findAndCount(Course, scope.query);

		return [courses, count];
	}
}

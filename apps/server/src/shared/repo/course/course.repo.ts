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

	byCourseIds(courseIds: EntityId[] = []): CourseScope {
		if (courseIds.length > 0) {
			const $or = courseIds.map((id) => ({ id }));

			this.addQuery({ $or });
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
}

@Injectable()
export class CourseRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean; courseIds?: EntityId[] },
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}

		if (filters?.courseIds) {
			scope.byCourseIds(filters.courseIds);
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

	async findAllForStudent(userId: EntityId): Promise<Counted<Course[]>> {
		const query = { students: userId };
		const [courses, count] = await this.em.findAndCount(Course, query);

		return [courses, count];
	}

	async findAllForTeacher(userId: EntityId): Promise<Counted<Course[]>> {
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };
		const query = { $or: [isTeacher, isSubstitutionTeacher] };

		const [courses, count] = await this.em.findAndCount(Course, query);

		return [courses, count];
	}
}

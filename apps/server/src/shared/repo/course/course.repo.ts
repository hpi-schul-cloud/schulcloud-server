import { Injectable } from '@nestjs/common';
import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';

import { EntityId, Course, Counted, IFindOptions } from '@shared/domain';
import { Scope } from '../scope';
import { BaseRepo } from '../base.repo';

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
		const noUntilDate = { untilDate: { $exists: false } } as FilterQuery<Course>;
		const untilDateInFuture = { untilDate: { $gte: now } };

		this.addQuery({ $or: [noUntilDate, untilDateInFuture] });

		return this;
	}

	forCourseId(courseId: EntityId): CourseScope {
		this.addQuery({ id: courseId });
		return this;
	}
}

@Injectable()
export class CourseRepo extends BaseRepo<Course> {
	get entityName() {
		return Course;
	}

	async findAllByUserId(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.onlyActiveCourses) {
			scope.forActiveCourses();
		}

		const { pagination, order } = options || {};
		const queryOptions = {
			offset: pagination?.skip,
			limit: pagination?.limit,
			orderBy: order as QueryOrderMap<Course>,
		};

		const [courses, count] = await this._em.findAndCount(Course, scope.query, queryOptions);

		return [courses, count];
	}

	// not tested in repo.integration.spec
	async findAllForTeacher(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forTeacher(userId);

		const [courses, count] = await this._em.findAndCount(Course, scope.query);

		return [courses, count];
	}

	async findOne(courseId: EntityId, userId?: EntityId): Promise<Course> {
		const scope = new CourseScope();
		scope.forCourseId(courseId);
		if (userId) scope.forAllGroupTypes(userId);

		const course = await this._em.findOneOrFail(Course, scope.query);

		return course;
	}
}

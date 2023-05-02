import { FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Counted, Course, EntityId, IFindOptions } from '@shared/domain';
import { BaseRepo } from '../base.repo';
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

	forTeacherOrSubstituteTeacher(userId: EntityId): CourseScope {
		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };

		if (userId) {
			this.addQuery({ $or: [isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}

	forTeacher(userId: EntityId): CourseScope {
		this.addQuery({ teachers: userId });
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

	async createCourse(course: Course): Promise<void> {
		return this.save(this.create(course));
	}

	async findById(id: EntityId): Promise<Course> {
		const course = await super.findById(id);
		await this._em.populate(course, ['courseGroups', 'students']);
		return course;
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

	async findAllForTeacher(
		userId: EntityId,
		filters?: { onlyActiveCourses?: boolean },
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forTeacher(userId);

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
	async findAllForTeacherOrSubstituteTeacher(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forTeacherOrSubstituteTeacher(userId);

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

	async findOneForTeacherOrSubstituteTeacher(userId: EntityId, courseId: EntityId): Promise<Course> {
		const scope = new CourseScope();
		scope.forCourseId(courseId);
		scope.forTeacherOrSubstituteTeacher(userId);
		const course = await this._em.findOneOrFail(Course, scope.query);

		await this._em.populate(course, ['students']);
		return course;
	}
}

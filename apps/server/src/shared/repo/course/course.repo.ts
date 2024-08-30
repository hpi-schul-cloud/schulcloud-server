import { QueryOrderMap } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { Course } from '@shared/domain/entity';
import { IFindOptions } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '../base.repo';
import { CourseScope } from './course.scope';

@Injectable()
export class CourseRepo extends BaseRepo<Course> {
	get entityName() {
		return Course;
	}

	async createCourse(course: Course): Promise<void> {
		return this.save(this.create(course));
	}

	async findById(id: EntityId, populate = true): Promise<Course> {
		const course = await super.findById(id);
		if (populate) {
			await this._em.populate(course, ['courseGroups', 'teachers', 'substitutionTeachers', 'students']);
		}
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
}

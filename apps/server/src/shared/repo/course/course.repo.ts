import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

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
}

@Injectable()
export class CourseRepo {
	constructor(private readonly em: EntityManager) {}

	/* TODO: No index is set for this query. */
	async findAllByUserId(
		userId: EntityId,
		filters?: { courseIds?: EntityId[] },
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const { select } = options || {};

		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);

		if (filters?.courseIds) {
			scope.byCourseIds(filters.courseIds);
		}

		const [courses, count] = await this.em.findAndCount(Course, scope.query, { fields: select });

		return [courses, count];
	}

	async findAllForStudent(
		userId: EntityId,
		filters?: undefined,
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const { select } = options || {};

		const query = { students: userId };
		const [courses, count] = await this.em.findAndCount(Course, query, { fields: select });

		return [courses, count];
	}

	async findAllForTeacher(
		userId: EntityId,
		filters?: undefined,
		options?: IFindOptions<Course>
	): Promise<Counted<Course[]>> {
		const { select } = options || {};

		const isTeacher = { teachers: userId };
		const isSubstitutionTeacher = { substitutionTeachers: userId };
		const query = { $or: [isTeacher, isSubstitutionTeacher] };
		const [courses, count] = await this.em.findAndCount(Course, query, { fields: select });

		return [courses, count];
	}
}

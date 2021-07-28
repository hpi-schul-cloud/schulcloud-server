import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, Counted } from '@shared/domain';
import { Scope, EmptyResultQuery } from '@shared/repo';

import { Course } from '../entity';
import { ICourseRepo } from '../uc';

const isDefined = (input) => input !== null && input !== undefined;

class CourseScope extends Scope<Course> {
	forAllRoles(userId: EntityId): CourseScope {
		const student = { studentIds: userId };
		const teacher = { teacherIds: userId };
		const substitutionTeacher = { substitutionTeacherIds: userId };
		const $or = [student, teacher, substitutionTeacher];

		const query = isDefined(userId) ? { $or } : EmptyResultQuery;
		this.addQuery(query);

		return this;
	}
}

@Injectable()
export class CourseRepo implements ICourseRepo {
	constructor(private readonly em: EntityManager) {}

	async getCourseOfUser(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllRoles(userId);
		const [courses, count] = await this.em.findAndCount(Course, scope.query);
		return [courses, count];
	}
}

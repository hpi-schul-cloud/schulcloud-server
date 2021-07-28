import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, Counted } from '@shared/domain';
import { Scope } from '@shared/repo';
import { Course } from '../entity';
import { CourseRepoInterface } from '../uc';

class CourseScope extends Scope<Course> {
	forAllRoles(userId: EntityId): CourseScope {
		const student = { studentIds: userId };
		const teacher = { teacherIds: userId };
		const substitutionTeacher = { substitutionTeacherIds: userId };
		const $or = [student, teacher, substitutionTeacher];
		this.addQuery({ $or });
		return this;
	}
}

@Injectable()
export class CourseRepo implements CourseRepoInterface {
	constructor(private readonly em: EntityManager) {}

	async getCourseOfUser(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllRoles(userId);
		const [courses, count] = await this.em.findAndCount(Course, scope.query);
		return [courses, count];
	}
}

import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, Counted } from '@shared/domain';
import { Scope } from '@shared/repo';

import { Course } from '../entity';
import { ICourseRepo } from '../uc';

class CourseScope extends Scope<Course> {
	forAllGroupTypes(userId: EntityId): CourseScope {
		const isStudent = { studentIds: userId };
		const isTeacher = { teacherIds: userId };
		const isSubstitutionTeacher = { substitutionTeacherIds: userId };

		if (userId) {
			this.addQuery({ $or: [isStudent, isTeacher, isSubstitutionTeacher] });
		}

		return this;
	}
}

@Injectable()
export class CourseRepo implements ICourseRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const scope = new CourseScope();
		scope.forAllGroupTypes(userId);
		const [courses, count] = await this.em.findAndCount(Course, scope.query);
		return [courses, count];
	}
}

import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, Counted } from '@shared/domain';
import { Scope } from '@shared/repo';

import { Coursegroup, Course } from '../entity';
import { ICoursegroupRepo } from '../uc';

class CoursegroupScope extends Scope<Coursegroup> {
	isMember(userId: EntityId): CoursegroupScope {
		const isStudent = { studentIds: userId };
		const query = this.useQueryIfValueIsDefined(userId, isStudent);
		this.addQuery(query);

		return this;
	}

	findByCourses(courses: Course[]): CoursegroupScope {
		const query = this.createOrQueryFromList(courses, 'id', 'courseId');
		this.addQuery(query);

		return this;
	}
}

@Injectable()
export class CoursegroupRepo implements ICoursegroupRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourses(courses: Course[]): Promise<Counted<Coursegroup[]>> {
		const scope = new CoursegroupScope();
		scope.findByCourses(courses);
		const [coursegroups, count] = await this.em.findAndCount(Coursegroup, scope.query);
		return [coursegroups, count];
	}
}

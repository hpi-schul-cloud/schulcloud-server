import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { EntityId, Counted } from '@shared/domain';
import { Scope, EmptyResultQuery } from '@shared/repo';

import { Coursegroup, Course } from '../entity';
import { ICoursegroupRepo } from '../uc';

const isDefined = (input) => input !== null && input !== undefined;
type EntityIdQuery = Record<string, ObjectId>;

class CoursegroupScope extends Scope<Coursegroup> {
	isMember(userId: EntityId): CoursegroupScope {
		const isStudent = { studentIds: userId };
		const query = isDefined(userId) ? isStudent : EmptyResultQuery;
		this.addQuery(query);

		return this;
	}

	findByCourses(courses: Course[]): CoursegroupScope {
		const list = Array.isArray(courses) ? courses : [];
		const $or = list.map((course): EntityIdQuery => ({ courseId: course._id }));
		const query = { $or };
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

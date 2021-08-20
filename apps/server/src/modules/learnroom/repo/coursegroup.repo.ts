import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Counted } from '@shared/domain';
import { Scope } from '@shared/repo';

import { Coursegroup, Course } from '../entity';
import { ICoursegroupRepo } from '../uc';

class CoursegroupScope extends Scope<Coursegroup> {
	byCourses(courses: Course[]): CoursegroupScope {
		this.buildAndAddOrQuery(courses, 'id', 'courseId');
		return this;
	}
}

@Injectable()
export class CoursegroupRepo implements ICoursegroupRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourses(courses: Course[]): Promise<Counted<Coursegroup[]>> {
		const scope = new CoursegroupScope();
		scope.byCourses(courses);
		const [coursegroups, count] = await this.em.findAndCount(Coursegroup, scope.query);
		return [coursegroups, count];
	}
}

import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Counted, EntityId, CourseGroup } from '@shared/domain';

@Injectable()
export class CourseGroupRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.em.findAndCount(CourseGroup, {
			course: { $in: courseIds },
		});
		return [courseGroups, count];
	}
}

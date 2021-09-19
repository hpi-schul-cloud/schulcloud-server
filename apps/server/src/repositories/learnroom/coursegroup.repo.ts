import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';

import { Counted, EntityId, Coursegroup } from '@shared/domain';

@Injectable()
export class CoursegroupRepo {
	constructor(private readonly em: EntityManager) {}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<Coursegroup[]>> {
		const [coursegroups, count] = await this.em.findAndCount(Coursegroup, {
			courseId: { $in: courseIds.map((id) => new ObjectId(id)) },
		});
		return [coursegroups, count];
	}
}

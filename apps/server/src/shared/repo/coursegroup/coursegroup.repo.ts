import { Injectable } from '@nestjs/common';

import { Counted, EntityId, CourseGroup } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CourseGroupRepo extends BaseRepo<CourseGroup> {
	get entityName() {
		return CourseGroup;
	}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this._em.findAndCount(CourseGroup, {
			course: { $in: courseIds },
		});
		return [courseGroups, count];
	}
}

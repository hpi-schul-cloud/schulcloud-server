import { Injectable } from '@nestjs/common';

import { Counted, EntityId, CourseGroup } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { BaseRepo } from '../base.repo';

@Injectable()
export class CourseGroupRepo extends BaseRepo<CourseGroup> {
	get entityName() {
		return CourseGroup;
	}

	async findById(id: string): Promise<CourseGroup> {
		const courseGroup = await super.findById(id);
		await this._em.populate(courseGroup, ['course']);
		return courseGroup;
	}

	async findByCourseIds(courseIds: EntityId[]): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this._em.findAndCount(CourseGroup, {
			course: { $in: courseIds },
		});
		return [courseGroups, count];
	}

	async findByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this._em.findAndCount<CourseGroup>(CourseGroup, {
			students: new ObjectId(userId),
		});
		return [courseGroups, count];
	}
}

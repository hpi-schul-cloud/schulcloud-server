import { Injectable } from '@nestjs/common';

import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { CourseGroup } from './coursegroup.entity';

@Injectable()
export class CourseGroupRepo extends BaseRepo<CourseGroup> {
	get entityName(): EntityName<CourseGroup> {
		return CourseGroup;
	}

	public async findById(id: string): Promise<CourseGroup> {
		const courseGroup = await super.findById(id);
		await this._em.populate(courseGroup, ['course']);
		return courseGroup;
	}

	public async findByCourseIds(courseIds: EntityId[]): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this._em.findAndCount(CourseGroup, {
			course: { $in: courseIds },
		});
		return [courseGroups, count];
	}

	public async findByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this._em.findAndCount<CourseGroup>(CourseGroup, {
			students: new ObjectId(userId),
		});
		return [courseGroups, count];
	}
}

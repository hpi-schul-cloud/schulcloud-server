import { EntityName } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { BaseRepo } from '@shared/repo/base.repo';
import { CourseGroupEntity } from './coursegroup.entity';

@Injectable()
export class CourseGroupRepo extends BaseRepo<CourseGroupEntity> {
	get entityName(): EntityName<CourseGroupEntity> {
		return CourseGroupEntity;
	}

	public async findById(id: string): Promise<CourseGroupEntity> {
		const courseGroup = await super.findById(id);
		await this._em.populate(courseGroup, ['course']);
		return courseGroup;
	}

	public async findByCourseIds(courseIds: EntityId[]): Promise<Counted<CourseGroupEntity[]>> {
		const [courseGroups, count] = await this._em.findAndCount(CourseGroupEntity, {
			course: { $in: courseIds },
		});
		return [courseGroups, count];
	}

	public async findByUserId(userId: EntityId): Promise<Counted<CourseGroupEntity[]>> {
		const [courseGroups, count] = await this._em.findAndCount<CourseGroupEntity>(CourseGroupEntity, {
			students: new ObjectId(userId),
		});
		return [courseGroups, count];
	}

	public async deleteUser(userId: EntityId): Promise<number> {
		const count = await this._em.nativeUpdate(CourseGroupEntity, { students: new ObjectId(userId) }, {
			$pull: { students: new ObjectId(userId) },
		} as Partial<CourseGroupEntity>);

		return count;
	}
}

import { Injectable } from '@nestjs/common';
import { CourseGroup } from '@shared/domain/entity/coursegroup.entity';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseGroupRepo } from '@shared/repo/coursegroup/coursegroup.repo';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo) {}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserDataFromCourseGroup(userId: EntityId): Promise<number> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		courseGroups.forEach((courseGroup) => courseGroup.removeStudent(userId));

		await this.repo.save(courseGroups);

		return count;
	}
}

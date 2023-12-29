import { Injectable } from '@nestjs/common';
import { CourseGroup } from '@shared/domain/entity';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseGroupRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo, private readonly logger: LegacyLogger) {
		this.logger.setContext(CourseGroupService.name);
	}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroup[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}

	public async deleteUserDataFromCourseGroup(userId: EntityId): Promise<number> {
		this.logger.log({ action: 'Deleting data from CourseGroup for user ', userId });
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		courseGroups.forEach((courseGroup) => courseGroup.removeStudent(userId));

		await this.repo.save(courseGroups);
		this.logger.log({ action: 'Deleted data from CourseGroup for user ', userId });

		return count;
	}
}

import { Logger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseGroupEntity, CourseGroupRepo } from '../../repo';

@Injectable()
export class CourseGroupService {
	constructor(private readonly repo: CourseGroupRepo, private readonly logger: Logger) {
		this.logger.setContext(CourseGroupService.name);
	}

	public async findAllCourseGroupsByUserId(userId: EntityId): Promise<Counted<CourseGroupEntity[]>> {
		const [courseGroups, count] = await this.repo.findByUserId(userId);

		return [courseGroups, count];
	}
}

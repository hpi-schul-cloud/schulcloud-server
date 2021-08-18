import { Injectable } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course } from './entity';
import { CourseUC } from './uc';

@Injectable()
export class LearnroomFacade {
	constructor(private readonly courseUC: CourseUC) {}

	/**
	 * Important the facade stategue is only a temporary solution until we established a better way for resolving the dependency graph
	 */
	async findCoursesWithGroupsByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		// ja ja der uc der den uc aufruft:P
		const [courses, count] = await this.courseUC.findCoursesWithGroupsByUserId(userId);
		return [courses, count];
	}
}

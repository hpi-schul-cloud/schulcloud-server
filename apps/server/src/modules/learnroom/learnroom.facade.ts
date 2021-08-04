import { Injectable } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course } from './entity';
import { CourseUC } from './uc';

@Injectable()
export class LearnroomFacade {
	constructor(private readonly courseUC: CourseUC) {}

	// TODO: i do not like to expose the Entity only the data + interface for it
	// add lessons
	async findCoursesWithGroupsByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.courseUC.findCoursesWithGroupsByUserId(userId);
		return [courses, count];
	}
}

import { Injectable } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course } from './entity';
import { CourseUC } from './uc';

@Injectable()
export class LearnroomFacade {
	constructor(private readonly courseUC: CourseUC) {}

	// TODO: i do not like to expose the Entity only the data + interface for it
	// and course groups?
	// and lessons ?
	// in context of all releated for xyz?
	async findAllCoursesFromUserByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.courseUC.findAllCoursesFromUserByUserId(userId);
		return [courses, count];
	}
}

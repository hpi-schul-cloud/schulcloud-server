import { Injectable } from '@nestjs/common';
import { EntityId, IFindOptions, Course, Counted } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findByUser(userId: EntityId, options?: IFindOptions<Course>): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, options);
	}
}

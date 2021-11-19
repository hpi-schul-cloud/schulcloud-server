import { Injectable } from '@nestjs/common';
import { EntityId, Course, Counted, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { PaginationQuery } from '@shared/controller/';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findActiveByUser(userId: EntityId, options?: PaginationQuery): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(
			userId,
			{ onlyActiveCourses: true },
			{ pagination: options, order: { name: SortOrder.asc } }
		);
	}
}

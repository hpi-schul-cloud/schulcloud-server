import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Counted, Course, EntityId, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}
}

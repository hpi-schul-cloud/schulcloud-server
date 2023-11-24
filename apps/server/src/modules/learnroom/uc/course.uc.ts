import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/';
import { Course } from '@shared/domain';
import { SortOrder } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}
}

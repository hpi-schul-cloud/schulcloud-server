import { Injectable } from '@nestjs/common';
import { PaginationParams } from '@shared/controller/dto/pagination.params';
import { Course } from '@shared/domain/entity/course.entity';
import { SortOrder } from '@shared/domain/interface/find-options';
import { Counted } from '@shared/domain/types/counted';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}
}

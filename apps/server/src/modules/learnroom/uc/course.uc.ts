import { Injectable } from '@nestjs/common';
import { EntityId, Course, Counted, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { PaginationParams } from '@shared/controller/';
import { ImsccFileBuilder } from '@src/modules/learnroom/imscc/imscc-file-builder';
import { Readable } from 'stream';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	findAllByUser(userId: EntityId, options?: PaginationParams): Promise<Counted<Course[]>> {
		return this.courseRepo.findAllByUserId(userId, {}, { pagination: options, order: { updatedAt: SortOrder.desc } });
	}

	async exportCourse(courseId: EntityId, userId?: EntityId): Promise<Readable> {
		const course = await this.courseRepo.findOne(courseId, userId);
		return new ImsccFileBuilder().addTitle(course.name).build();
	}
}

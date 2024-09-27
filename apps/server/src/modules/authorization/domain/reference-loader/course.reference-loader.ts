import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CourseDoService } from '@src/modules/learnroom';
import { Course } from '@src/modules/learnroom/domain';

@Injectable()
export class CourseReferenceLoader implements AuthorizationLoaderServiceGeneric<Course> {
	constructor(private readonly courseService: CourseDoService, injectionService: AuthorizationInjectionService) {
		injectionService.injectReferenceLoader(AuthorizableReferenceType.User, this);
	}

	public async findById(courseId: EntityId): Promise<Course> {
		const course: Course = await this.courseService.findById(courseId);

		return course;
	}
}

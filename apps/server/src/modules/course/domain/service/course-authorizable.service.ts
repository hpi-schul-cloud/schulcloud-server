import {
	AuthorizableReferenceType,
	AuthorizationInjectionService,
	AuthorizationLoaderServiceGeneric,
} from '@modules/authorization';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Course } from '../course.do';
import { COURSE_REPO, CourseRepo } from '../interface';

@Injectable()
export class CourseAuthorizableService implements AuthorizationLoaderServiceGeneric<Course> {
	constructor(
		@Inject(COURSE_REPO) private readonly courseRepo: CourseRepo,
		private readonly injectionService: AuthorizationInjectionService
	) {
		this.injectionService.injectReferenceLoader(AuthorizableReferenceType.Course, this);
	}

	public async findById(id: EntityId): Promise<Course> {
		const course = await this.courseRepo.findCourseById(id);

		return course;
	}
}

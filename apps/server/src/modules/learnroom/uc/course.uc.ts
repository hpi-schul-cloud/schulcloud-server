import { Injectable, Inject } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course } from '../entity';

export interface ICourseRepo {
	getCourseOfUser(userId: EntityId): Promise<Counted<Course[]>>;
}

@Injectable()
export class CourseUC {
	err = {
		invalidUserId: 'An invalid userId is passing as parameter.',
	};

	constructor(@Inject('CourseRepo') readonly repo: ICourseRepo) {}

	async findAllCoursesFromUserByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.repo.getCourseOfUser(userId);
		return [courses, count];
	}
}

import { Injectable, Inject } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course, Coursegroup } from '../entity';

export interface ICourseRepo {
	findAllByUserId(userId: EntityId): Promise<Counted<Course[]>>;
}

export interface ICoursegroupRepo {
	findByCourses(courses: Course[]): Promise<Counted<Coursegroup[]>>;
}

@Injectable()
export class CourseUC {
	constructor(
		@Inject('CourseRepo') readonly courseRepo: ICourseRepo,
		@Inject('CoursegroupRepo') readonly coursegroupRepo: ICoursegroupRepo
	) {}

	async findCoursesWithGroupsByUserId(userId: EntityId): Promise<Counted<Course[]>> {
		const [courses, count] = await this.courseRepo.findAllByUserId(userId);
		const [coursesgroups] = await this.coursegroupRepo.findByCourses(courses);
		/**
		 * Important setGroupsThatMatchCourse is a temporary solution until we tested application only entitys
		 */
		courses.forEach((course) => course.setGroupsThatMatchCourse(coursesgroups));
		return [courses, count];
	}
}

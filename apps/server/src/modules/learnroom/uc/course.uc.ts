import { Injectable } from '@nestjs/common';
import { EntityId, Course, Counted, SortOrder } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { PaginationQuery } from '@shared/controller/';

@Injectable()
export class CourseUc {
	constructor(private readonly courseRepo: CourseRepo) {}

	async findAllByUser(userId: EntityId, options?: PaginationQuery): Promise<Counted<Course[]>> {
		const [courses, count] = await this.courseRepo.findAllByUserId(userId, {}, { pagination: options });
		const openCourses: Course[] = courses.filter((c) => !c.isFinished()).sort((a, b) => a.name.localeCompare(b.name));
		const archivedCourses: Course[] = courses
			.filter((c) => c.isFinished())
			.sort((a, b) => a.name.localeCompare(b.name));
		const sortedCourses = [...openCourses, ...archivedCourses];
		return [sortedCourses, count];
	}
}

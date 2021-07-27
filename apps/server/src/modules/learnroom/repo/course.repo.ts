import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Counted } from '@shared/domain';
import { Course } from '../entity';
import { CourseRepoInterface } from '../uc';

@Injectable()
export class CourseRepo implements CourseRepoInterface {
	constructor(private readonly em: EntityManager) {}

	async getCourseOfUser(userId: EntityId): Promise<Counted<Course[]>> {
		// const $or = [{ userId }, { teacherId: userId }, { substitionId: userId }];
		const [courses, count] = await this.em.findAndCount(Course, {
			$or: [{ userIds: userId }, { teacherId: userId }, { substitionId: userId }],
		});
		return [courses, count];
	}
}

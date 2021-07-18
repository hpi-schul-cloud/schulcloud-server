import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { CourseEntity, CoursegroupEntity } from '../entity';

// TODO: add schoolId as filter vs shd operations?
// TODO: move to user module but this bring optimization problems
@Injectable()
export class GroupRepo {
	constructor(private readonly em: EntityManager) {}

	async getCoursesByUserId(userId: EntityId): Promise<CourseEntity[]> {
		const coursesOfUser = await this.em.find(CourseEntity, {
			$or: [
				{
					studentIds: userId,
				},
				{
					teacherIds: userId,
				},
				{
					substitutionTeacherIds: userId,
				},
			],
		});
		return coursesOfUser;
	}

	async getCourseGroupsByUserId(userId: EntityId): Promise<CoursegroupEntity[]> {
		const courseGroupsOfUser = await this.em.find(CoursegroupEntity, { studentIds: userId });
		return courseGroupsOfUser;
	}
}

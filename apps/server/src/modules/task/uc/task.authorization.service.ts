import { Injectable } from '@nestjs/common';
import { EntityId, Course } from '@shared/domain';
import { CourseRepo } from '@shared/repo';

export enum TaskParentPermission {
	read,
	write,
}

@Injectable()
export class TaskAuthorizationService {
	constructor(private readonly courseRepo: CourseRepo) {}

	/**
	 * Important user group operations are only a temporary solution until we have established groups
	 */
	async getPermittedCourses(userId: EntityId, permission: TaskParentPermission): Promise<EntityId[]> {
		// courseGroups are missing
		// lessons are missing -> only search for hidden: false,
		let permittedCourses: Course[] = [];
		if (permission === TaskParentPermission.write) {
			[permittedCourses] = await this.courseRepo.findAllForTeacher(userId);
		} else if (permission === TaskParentPermission.read) {
			[permittedCourses] = await this.courseRepo.findAllForStudent(userId);
		}

		const entityIds = permittedCourses.map((o) => o.id);
		return entityIds;
	}
}

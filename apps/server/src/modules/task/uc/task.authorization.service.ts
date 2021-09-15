import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { CourseRepo } from '@src/repositories';

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
		// coursegroups are missing
		// lessons are missing -> only search for hidden: false,
		const [permittedCourses] =
			permission === TaskParentPermission.write
				? await this.courseRepo.findAllForTeacher(userId)
				: await this.courseRepo.findAllForStudent(userId);

		const entityIds = permittedCourses.map((o) => o.id);
		return entityIds;
	}
}

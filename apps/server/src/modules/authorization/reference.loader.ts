import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, EntityId, School, Task, User } from '@shared/domain';
import { CourseRepo, SchoolRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AllowedAuthorizationEntityType } from './interfaces';

@Injectable()
export class ReferenceLoader {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: SchoolRepo
	) {}

	async loadEntity(entityName: AllowedAuthorizationEntityType, entityId: EntityId) {
		let entity: Task | Course | User | School;
		if (entityName === AllowedAuthorizationEntityType.Task) {
			entity = await this.taskRepo.findById(entityId);
		} else if (entityName === AllowedAuthorizationEntityType.Course) {
			entity = await this.courseRepo.findById(entityId);
		} else if (entityName === AllowedAuthorizationEntityType.School) {
			entity = await this.schoolRepo.findById(entityId);
		} else if (entityName === AllowedAuthorizationEntityType.User) {
			entity = await this.userRepo.findById(entityId);
		} else {
			throw new NotImplementedException('REPO_NOT_IMPLEMENT');
		}
		return entity;
	}

	async getUserWithPermissions(userId: EntityId) {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}

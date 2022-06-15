import { Injectable, NotImplementedException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { CourseRepo, SchoolRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AllowedAuthorizationEntityType } from './interfaces';

@Injectable()
export class ReferenceLoader {
	private repos: Map<AllowedAuthorizationEntityType, TaskRepo | CourseRepo | UserRepo | SchoolRepo> = new Map();

	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly taskRepo: TaskRepo,
		private readonly schoolRepo: SchoolRepo
	) {
		this.repos.set(AllowedAuthorizationEntityType.Task, this.taskRepo);
		this.repos.set(AllowedAuthorizationEntityType.Course, this.courseRepo);
		this.repos.set(AllowedAuthorizationEntityType.User, this.userRepo);
		this.repos.set(AllowedAuthorizationEntityType.School, this.schoolRepo);
	}

	private resolveRepo(type: AllowedAuthorizationEntityType) {
		const repo = this.repos.get(type);
		if (repo) {
			return repo;
		}
		throw new NotImplementedException('REPO_NOT_IMPLEMENT');
	}

	async loadEntity(entityName: AllowedAuthorizationEntityType, entityId: EntityId) {
		const entity = await this.resolveRepo(entityName).findById(entityId);

		return entity;
	}

	async getUserWithPermissions(userId: EntityId) {
		const user = await this.userRepo.findById(userId, true);

		return user;
	}
}

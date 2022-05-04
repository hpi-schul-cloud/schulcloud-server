import { Injectable, NotImplementedException } from '@nestjs/common';
import { Course, EntityId, FileRecord, School, Task, User } from '@shared/domain';
import { CourseRepo, FileRecordRepo, SchoolRepo, TaskRepo, UserRepo } from '@shared/repo';
import { AllowedEntityType } from './interfaces';

@Injectable()
export class ReferenceLoader {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly courseRepo: CourseRepo,
		private readonly taskRepo: TaskRepo,
		private readonly fileRecordRepo: FileRecordRepo,
		private readonly schoolRepo: SchoolRepo
	) {}

	async loadEntity(entityName: AllowedEntityType, entityId: string) {
		let entity: Task | Course | FileRecord | School | User;
		if (entityName === AllowedEntityType.Task) {
			entity = await this.taskRepo.findById(entityId);
		} else if (entityName === AllowedEntityType.Course) {
			entity = await this.courseRepo.findById(entityId);
		} else if (entityName === AllowedEntityType.FileRecord) {
			entity = await this.fileRecordRepo.findById(entityId);
		} else if (entityName === AllowedEntityType.School) {
			entity = await this.schoolRepo.findById(entityId);
		} else if (entityName === AllowedEntityType.User) {
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

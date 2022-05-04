import { ForbiddenException, Injectable, NotImplementedException } from '@nestjs/common';
import {
	Actions,
	BaseRule,
	Course,
	CourseRule,
	EntityId,
	FileRecord,
	IEntity,
	School,
	Task,
	TaskRule,
	User,
} from '@shared/domain';
import { FileRecordRule } from '@shared/domain/rules/file-record.rule';
import { SchoolRule } from '@shared/domain/rules/school.rule';
import { AllowedEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BaseRule {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly fileRecordRule: FileRecordRule,
		private readonly schoolRule: SchoolRule,
		private readonly service: ReferenceLoader
	) {
		super();
	}

	hasPermission(user: User, entity: IEntity, action: Actions): boolean {
		let permission = false;

		if (entity instanceof Task) {
			permission = this.taskRule.hasPermission(user, entity, action);
		} else if (entity instanceof Course) {
			permission = this.courseRule.hasPermission(user, entity, action);
		} else if (entity instanceof School) {
			permission = this.schoolRule.hasPermission(user, entity, action);
		} else if (entity instanceof FileRecord) {
			permission = this.fileRecordRule.hasPermission(user, entity, action);
		} else {
			throw new NotImplementedException('RULE_NOT_IMPLEMENT');
		}

		return permission;
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedEntityType,
		entityId: EntityId,
		action: Actions
	): Promise<boolean> {
		let permission = false;
		const [user, entity] = await Promise.all([
			this.service.getUserWithPermissions(userId),
			this.service.loadEntity(entityName, entityId),
		]);

		permission = this.hasPermission(user, entity, action);

		return permission;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedEntityType,
		entityId: EntityId,
		action: Actions
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, action))) {
			throw new ForbiddenException();
		}
	}

	async getUserWithPermissions(userId: EntityId) {
		return this.service.getUserWithPermissions(userId);
	}
}

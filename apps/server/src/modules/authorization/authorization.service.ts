import { ForbiddenException, Injectable, NotImplementedException } from '@nestjs/common';
import { BaseRule, Course, CourseRule, EntityId, IEntity, School, Task, TaskRule, User } from '@shared/domain';
import { IPermissionContext } from '@shared/domain/interface/permission';
import { SchoolRule } from '@shared/domain/rules/school.rule';
import { AllowedEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BaseRule {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly schoolRule: SchoolRule,
		private readonly service: ReferenceLoader
	) {
		super();
	}

	hasPermission(user: User, entity: IEntity, context: IPermissionContext): boolean {
		let permission = false;

		if (entity instanceof Task) {
			permission = this.taskRule.hasPermission(user, entity, context);
		} else if (entity instanceof Course) {
			permission = this.courseRule.hasPermission(user, entity, context);
		} else if (entity instanceof School) {
			permission = this.schoolRule.hasPermission(user, entity, context);
		} else {
			throw new NotImplementedException('RULE_NOT_IMPLEMENT');
		}

		return permission;
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedEntityType,
		entityId: EntityId,
		context: IPermissionContext
	): Promise<boolean> {
		let permission = false;
		const [user, entity] = await Promise.all([
			this.service.getUserWithPermissions(userId),
			this.service.loadEntity(entityName, entityId),
		]);

		permission = this.hasPermission(user, entity, context);

		return permission;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedEntityType,
		entityId: EntityId,
		context: IPermissionContext
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	async getUserWithPermissions(userId: EntityId) {
		return this.service.getUserWithPermissions(userId);
	}
}

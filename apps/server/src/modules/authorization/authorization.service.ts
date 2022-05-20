import { ForbiddenException, Injectable, NotImplementedException } from '@nestjs/common';
import { BaseRule, Course, CourseRule, EntityId, School, Task, TaskRule, User, UserRule } from '@shared/domain';
import { IPermissionContext } from '@shared/domain/interface/permission';
import { SchoolRule } from '@shared/domain/rules/school.rule';
import { AllowedAuthorizationEntityType, AllowedEntity } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BaseRule {
	private rules: Map<string, TaskRule | CourseRule | UserRule | SchoolRule> = new Map();

	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly schoolRule: SchoolRule,
		private readonly userRule: UserRule,
		private readonly service: ReferenceLoader
	) {
		super();
		this.rules.set(Task.name, this.taskRule);
		this.rules.set(Course.name, this.courseRule);
		this.rules.set(User.name, this.userRule);
		this.rules.set(School.name, this.schoolRule);
	}

	private resolveRule(entity: AllowedEntity) {
		const rule = this.rules.get(entity.constructor.name);
		if (rule) {
			return rule;
		}
		throw new NotImplementedException('RULE_NOT_IMPLEMENT');
	}

	hasPermission(user: User, entity: AllowedEntity, context: IPermissionContext): boolean {
		let permission = false;
		const rule = this.resolveRule(entity);
		permission = rule.hasPermission(user, entity as Task & Course & User & School, context);

		return permission;
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IPermissionContext
	): Promise<boolean> {
		const [user, entity] = await Promise.all([
			this.service.getUserWithPermissions(userId),
			this.service.loadEntity(entityName, entityId),
		]);

		const permission = this.hasPermission(user, entity, context);

		return permission;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
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

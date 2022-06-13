import { ForbiddenException, Injectable } from '@nestjs/common';
import { CourseRule, EntityId, TaskRule, User, UserRule, SchoolRule, BasePermissionManager } from '@shared/domain';
import { IEntity, IPermissionContext } from '@shared/domain/interface';
import { BaseDomainObject } from '@shared/domain/interface/domain-object';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

type PermissionRelations = IEntity | BaseDomainObject;

@Injectable()
export class AuthorizationService extends BasePermissionManager {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly schoolRule: SchoolRule,
		private readonly userRule: UserRule,
		private readonly loader: ReferenceLoader
	) {
		super();
		this.registerPermissions([this.courseRule, this.taskRule, this.userRule, this.schoolRule]);
	}

	checkPermission(user: User, entity: PermissionRelations, context: IPermissionContext) {
		if (!this.hasPermission(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IPermissionContext
	): Promise<boolean> {
		const [user, entity] = await Promise.all([
			this.loader.getUserWithPermissions(userId),
			this.loader.loadEntity(entityName, entityId),
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
		return this.loader.getUserWithPermissions(userId);
	}
}

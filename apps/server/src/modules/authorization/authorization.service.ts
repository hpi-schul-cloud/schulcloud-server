import { ForbiddenException, Injectable } from '@nestjs/common';
import {
	BasePermissionManager,
	CourseRule,
	EntityId,
	LessonRule,
	SchoolRule,
	TaskRule,
	User,
	UserRule,
	Permission,
	PermissionContextBuilder,
} from '@shared/domain';
import { IPermissionContext, PermissionTypes } from '@shared/domain/interface';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BasePermissionManager {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolRule: SchoolRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly loader: ReferenceLoader
	) {
		super();
		this.registerPermissions([
			this.courseRule,
			this.lessonRule,
			this.taskRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
		]);
	}

	checkPermission(user: User, entity: PermissionTypes, context: IPermissionContext) {
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
		try {
			const [user, entity] = await Promise.all([
				this.loader.getUserWithPermissions(userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const permission = this.hasPermission(user, entity, context);

			return permission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}

	async hasPermissionsByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		permissions: Permission[]
	): Promise<Map<Permission, boolean>> {
		const returnMap: Map<Permission, boolean> = new Map();
		await Promise.all(
			permissions.map(async (perm) => {
				const ret = await this.hasPermissionByReferences(
					userId,
					entityName,
					entityId,
					PermissionContextBuilder.permissionOnly([perm])
				);
				returnMap.set(perm, ret);
			})
		);
		return returnMap;
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
		try {
			const userWithPermissions = await this.loader.getUserWithPermissions(userId);

			return userWithPermissions;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}
}

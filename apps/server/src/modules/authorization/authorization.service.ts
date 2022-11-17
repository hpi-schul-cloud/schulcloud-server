import { ForbiddenException, Injectable } from '@nestjs/common';
import {
	Actions,
	BaseRuleManager,
	CourseGroupRule,
	CourseRule,
	EntityId,
	LessonRule,
	Permission,
	AuthorizationContextBuilder,
	SchoolRule,
	SubmissionRule,
	TaskRule,
	User,
	UserRule,
} from '@shared/domain';
import { IAuthorizationContext, AuthorizableObjectType } from '@shared/domain/interface';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BaseRuleManager {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolRule: SchoolRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule,
		private readonly loader: ReferenceLoader
	) {
		super();
		this.registerRules([
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
			this.submissionRule,
		]);
	}

	checkPermission(user: User, entity: AuthorizableObjectType, context: IAuthorizationContext) {
		if (!this.hasPermission(user, entity, context)) {
			throw new ForbiddenException();
		}
	}

	async hasPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IAuthorizationContext
	): Promise<boolean> {
		try {
			const [user, entity] = await Promise.all([
				this.loader.loadEntity(AllowedAuthorizationEntityType.User, userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const permission = this.hasPermission(user as User, entity, context);

			return permission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}

	hasPermissionsByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		permissions: Permission[],
		action: Actions
	): Map<Permission, Promise<boolean>> {
		const returnMap: Map<Permission, Promise<boolean>> = new Map();
		permissions.forEach((perm) => {
			const context =
				action === Actions.read ? AuthorizationContextBuilder.read([perm]) : AuthorizationContextBuilder.write([perm]);
			const ret = this.hasPermissionByReferences(userId, entityName, entityId, context);
			returnMap.set(perm, ret);
		});
		return returnMap;
	}

	async checkPermissionByReferences(
		userId: EntityId,
		entityName: AllowedAuthorizationEntityType,
		entityId: EntityId,
		context: IAuthorizationContext
	) {
		if (!(await this.hasPermissionByReferences(userId, entityName, entityId, context))) {
			throw new ForbiddenException();
		}
	}

	async getUserWithPermissions(userId: EntityId): Promise<User> {
		try {
			const userWithPermissions: User = (await this.loader.loadEntity(
				AllowedAuthorizationEntityType.User,
				userId
			)) as User;

			return userWithPermissions;
		} catch (err) {
			throw new ForbiddenException(err);
		}
	}
}

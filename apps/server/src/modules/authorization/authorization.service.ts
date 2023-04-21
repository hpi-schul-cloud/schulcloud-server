import { ForbiddenException, Injectable } from '@nestjs/common';
import {
	BasePermissionManager,
	CourseGroupRule,
	CourseRule,
	EntityId,
	FileElementRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SubmissionRule,
	TaskCardRule,
	TaskRule,
	User,
	UserRule,
} from '@shared/domain';
import { IPermissionContext, PermissionTypes } from '@shared/domain/interface';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { AllowedAuthorizationEntityType } from './interfaces';
import { ReferenceLoader } from './reference.loader';

@Injectable()
export class AuthorizationService extends BasePermissionManager {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolRule: SchoolRule,
		private readonly taskRule: TaskRule,
		private readonly taskCardRule: TaskCardRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule,
		private readonly loader: ReferenceLoader,
		private readonly schoolExternalToolRule: SchoolExternalToolRule,
		private readonly fileElementRule: FileElementRule
	) {
		super();
		this.registerPermissions([
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.taskCardRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
			this.submissionRule,
			this.schoolExternalToolRule,
			this.fileElementRule,
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
				this.getUserWithPermissions(userId),
				this.loader.loadEntity(entityName, entityId),
			]);
			const permission = this.hasPermission(user, entity, context);

			return permission;
		} catch (err) {
			throw new ForbiddenException(err);
		}
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

	async getUserWithPermissions(userId: EntityId): Promise<User> {
		const userWithPermissions = await this.loader.getUserWithPermissions(userId);

		return userWithPermissions;
	}
}

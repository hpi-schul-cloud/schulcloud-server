import { Injectable } from '@nestjs/common';
import { Submission, User } from '../entity';
import { IPermissionContext, PermissionTypes } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule extends BasePermission<Submission> {
	constructor(private readonly taskRule: TaskRule) {
		super();
	}

	public isApplicable(user: User, entity: PermissionTypes): boolean {
		const isMatched = entity instanceof Submission;

		return isMatched;
	}

	public hasPermission(user: User, entity: Submission, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasGeneralPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const hasSpecificPermission = this.hasSpecificPermission(user, entity, action);

		const result = hasGeneralPermission && hasSpecificPermission;

		return result;
	}

	private hasSpecificPermission(user: User, entity: Submission, action: Actions): boolean {
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['student']);
		const isTeamMember = this.utils.hasAccessToEntity(user, entity, ['teamMembers']);
		const isInCourseGroup =
			!!entity.courseGroup && this.utils.hasAccessToEntity(user, entity.courseGroup, ['students']);
		const hasParentWritePermission = this.hasParentPermission(user, entity, Actions.write);
		const hasParentReadPermission = this.hasParentPermission(user, entity, Actions.read);
		const areSubmissionsPublic = !!entity.task && !!entity.task.publicSubmissions;

		const hasSpecificPermission =
			isCreator ||
			isTeamMember ||
			isInCourseGroup ||
			hasParentWritePermission ||
			(action === Actions.read && hasParentReadPermission && areSubmissionsPublic);

		return hasSpecificPermission;
	}

	private hasParentPermission(user: User, entity: Submission, action: Actions) {
		let hasParentPermission = false;

		if (entity.task) {
			hasParentPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		}

		return hasParentPermission;
	}
}

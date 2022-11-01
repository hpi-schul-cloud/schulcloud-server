import { Injectable } from '@nestjs/common';
import { Submission, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { TaskRule } from './task.rule';

@Injectable()
export class SubmissionRule extends BasePermission<Submission> {
	constructor(private readonly taskRule: TaskRule) {
		super();
	}

	public isApplicable(user: User, entity: Submission): boolean {
		const isMatched = entity instanceof Submission;

		return isMatched;
	}

	public hasPermission(user: User, entity: Submission, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasGeneralPermission = this.utils.hasAllPermissions(user, requiredPermissions);

		let hasSpecificPermission = false;
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['student']);

		if (isCreator) {
			hasSpecificPermission = true;
		} else if (action === Actions.read) {
			hasSpecificPermission = this.hasReadPermission(user, entity);
		} else if (action === Actions.write) {
			hasSpecificPermission = this.hasWritePermission(user, entity);
		}

		const result = hasGeneralPermission && hasSpecificPermission;

		return result;
	}

	private hasReadPermission(user: User, entity: Submission): boolean {
		let hasParentReadPermission = false;
		if (entity.task && entity.task.publicSubmissions) {
			hasParentReadPermission = this.hasParentPermission(user, entity, Actions.read);
		} else {
			hasParentReadPermission = this.hasParentPermission(user, entity, Actions.write);
		}
		return hasParentReadPermission;
	}

	private hasWritePermission(user: User, entity: Submission): boolean {
		const hasParentWritePermission = this.hasParentPermission(user, entity, Actions.write);

		return hasParentWritePermission;
	}

	private hasParentPermission(user: User, entity: Submission, action: Actions) {
		let hasParentPermission = false;

		if (entity.task) {
			hasParentPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		}

		return hasParentPermission;
	}
}

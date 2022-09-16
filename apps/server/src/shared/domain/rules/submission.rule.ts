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
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['student']);

		let hasSubmissionPermission = false;

		if (action === Actions.read) {
			hasSubmissionPermission = this.submissionReadPermission(user, entity);
		} else if (action === Actions.write) {
			hasSubmissionPermission = this.submissionWritePermission(user, entity);
		}

		const result = hasPermission && (isCreator || hasSubmissionPermission);

		return result;
	}

	private submissionReadPermission(user: User, entity: Submission): boolean {
		let hasParentReadPermission = false;
		if (entity.task && entity.task.publicSubmissions) {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.read);
		} else {
			hasParentReadPermission = this.parentPermission(user, entity, Actions.write);
		}
		return hasParentReadPermission;
	}

	private submissionWritePermission(user: User, entity: Submission): boolean {
		const hasParentWritePermission = this.parentPermission(user, entity, Actions.write);

		return hasParentWritePermission;
	}

	private parentPermission(user: User, entity: Submission, action: Actions) {
		let hasParentPermission = false;

		if (entity.task) {
			hasParentPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		}

		return hasParentPermission;
	}
}

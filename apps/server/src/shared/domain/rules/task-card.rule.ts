import { Injectable } from '@nestjs/common';
import { TaskCard, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
// import { TaskRule } from './task.rule';

@Injectable()
export class TaskCardRule extends BasePermission<TaskCard> {
	public isApplicable(user: User, entity: TaskCard): boolean {
		const isMatched = entity instanceof TaskCard;

		return isMatched;
	}

	public hasPermission(user: User, entity: TaskCard, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);

		let hasTaskPermission = false;

		if (action === Actions.read) {
			hasTaskPermission = this.taskCardReadPermission(user, entity);
		} else if (action === Actions.write) {
			hasTaskPermission = this.taskCardWritePermission(user, entity);
		}

		const result = hasPermission && (isCreator || hasTaskPermission);

		return result;
	}

	private taskCardReadPermission(user: User, entity: TaskCard): boolean {
		let hasParentReadPermission = false;

		if (entity.isDraft) {
			hasParentReadPermission = this.hasTaskPermission(user, entity, Actions.write);
		} else {
			hasParentReadPermission = this.hasTaskPermission(user, entity, Actions.read);
		}

		const result = hasParentReadPermission;

		return result;
	}

	private taskCardWritePermission(user: User, entity: TaskCard): boolean {
		const hasParentWritePermission = this.hasTaskPermission(user, entity, Actions.write);

		return hasParentWritePermission;
	}

	// TODO
	// private hasParentBoardPermission()

	private hasTaskPermission(user: User, entity: TaskCard, action: Actions): boolean {
		const hasParentPermission = true;
		// TODO

		// const hasParentPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		return hasParentPermission;
	}
}

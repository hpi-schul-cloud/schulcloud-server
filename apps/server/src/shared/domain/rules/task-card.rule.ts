import { Injectable } from '@nestjs/common';
import { TaskCard, User } from '../entity';
import { IPermissionContext } from '../interface/permission';
import { Actions } from './actions.enum';
import { BasePermission } from './base-permission';
import { TaskRule } from './task.rule';

@Injectable()
export class TaskCardRule extends BasePermission<TaskCard> {
	constructor(private readonly taskRule: TaskRule) {
		super();
	}

	public isApplicable(user: User, entity: TaskCard): boolean {
		const isMatched = entity instanceof TaskCard;

		return isMatched;
	}

	public hasPermission(user: User, entity: TaskCard, context: IPermissionContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		if (!hasPermission) {
			return false;
		}

		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);
		if (isCreator) {
			return true;
		}

		if (action === Actions.read) {
			return this.hasReadPermission(user, entity);
		}
		if (action === Actions.write) {
			return this.hasWritePermission(user, entity);
		}

		return false;
	}

	private hasReadPermission(user: User, entity: TaskCard): boolean {
		if (entity.isDraft) {
			return this.hasWritePermission(user, entity);
		}

		return this.hasTaskPermission(user, entity, Actions.read);
	}

	private hasWritePermission(user: User, entity: TaskCard): boolean {
		const hasPermission = this.hasTaskPermission(user, entity, Actions.write);

		return hasPermission;
	}

	// private hasParentBoardPermission()
	private hasTaskPermission(user: User, entity: TaskCard, action: Actions): boolean {
		const hasPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		return hasPermission;
	}
}

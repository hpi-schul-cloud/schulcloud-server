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
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);

		let hasTaskCardPermission = false;

		if (action === Actions.read) {
			hasTaskCardPermission = this.hasTaskPermission(user, entity, Actions.read);
		} else if (action === Actions.write) {
			hasTaskCardPermission = this.hasTaskPermission(user, entity, Actions.write);
		}

		const result = hasPermission && (isCreator || hasTaskCardPermission);

		return result;
	}

	private hasTaskPermission(user: User, entity: TaskCard, action: Actions): boolean {
		const hasPermission = this.taskRule.hasPermission(user, entity.task, { action, requiredPermissions: [] });
		return hasPermission;
	}
}

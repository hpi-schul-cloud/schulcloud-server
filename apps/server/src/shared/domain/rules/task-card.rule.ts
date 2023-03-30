import { Injectable } from '@nestjs/common';
import { TaskCard, User } from '../entity';
import { Permission } from '../interface';
import { AuthorizationContext } from '../interface/permission';
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

	public hasPermission(user: User, entity: TaskCard, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.utils.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.utils.hasAccessToEntity(user, entity, ['creator']);

		let hasTaskPermission = false;

		if (action === Actions.read) {
			hasTaskPermission = this.taskRule.hasPermission(user, entity.task, {
				action,
				requiredPermissions: [Permission.HOMEWORK_VIEW],
			});
		} else if (action === Actions.write) {
			hasTaskPermission = this.taskRule.hasPermission(user, entity.task, {
				action,
				requiredPermissions: [Permission.HOMEWORK_EDIT],
			});
		}

		const result = hasPermission && (isCreator || hasTaskPermission);

		return result;
	}
}

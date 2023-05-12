import { Injectable } from '@nestjs/common';
import { TaskCard, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { Action, AuthorizationContext, Rule } from '@src/modules/authorization/types';
import { TaskRule } from './task.rule';

@Injectable()
export class TaskCardRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper, private readonly taskRule: TaskRule) {}

	public isApplicable(user: User, entity: TaskCard): boolean {
		const isMatched = entity instanceof TaskCard;

		return isMatched;
	}

	public hasPermission(user: User, entity: TaskCard, context: AuthorizationContext): boolean {
		const { action, requiredPermissions } = context;
		const hasPermission = this.authorizationHelper.hasAllPermissions(user, requiredPermissions);
		const isCreator = this.authorizationHelper.hasAccessToEntity(user, entity, ['creator']);

		let hasTaskPermission = false;

		if (action === Action.read) {
			hasTaskPermission = this.taskRule.hasPermission(user, entity.task, {
				action,
				requiredPermissions: [Permission.HOMEWORK_VIEW],
			});
		} else if (action === Action.write) {
			hasTaskPermission = this.taskRule.hasPermission(user, entity.task, {
				action,
				requiredPermissions: [Permission.HOMEWORK_EDIT],
			});
		}

		const result = hasPermission && (isCreator || hasTaskPermission);

		return result;
	}
}

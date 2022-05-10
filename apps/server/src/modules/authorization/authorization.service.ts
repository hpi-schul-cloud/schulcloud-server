import { Injectable, NotImplementedException } from '@nestjs/common';
import { Actions, BaseRule, Course, CourseRule, IEntity, Task, TaskRule, User, UserRule } from '@shared/domain';

@Injectable()
export class AuthorizationService extends BaseRule {
	constructor(
		private readonly courseRule: CourseRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule
	) {
		super();
	}

	hasPermission(user: User, entity: IEntity, action: Actions): boolean {
		let permission = false;

		if (entity instanceof Task) {
			permission = this.taskRule.hasPermission(user, entity, action);
		} else if (entity instanceof Course) {
			permission = this.courseRule.hasPermission(user, entity, action);
		} else if (entity instanceof User) {
			permission = this.userRule.hasPermission(user, entity, action);
		} else {
			throw new NotImplementedException('RULE_NOT_IMPLEMENT');
		}

		return permission;
	}
}

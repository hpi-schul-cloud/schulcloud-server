import { User } from '../entity/user.entity';
import { IRule, IAuthorizationContext, AuthorizableObject } from '../interface';
import { BaseRule } from './base-rule';
import { AuthorisationUtils } from './authorisation.utils';
import { SingleSelectStrategie } from './select-strategies';

export abstract class BaseRuleManager extends AuthorisationUtils implements IRule {
	protected rules: BaseRule[] = [];

	protected selectStrategie = new SingleSelectStrategie<BaseRule>();

	hasPermission(user: User, entity: AuthorizableObject, context: IAuthorizationContext) {
		const rules = this.selectRules(user, entity, context);
		const rule = this.selectStrategie.match(rules);

		return rule.hasPermission(user, entity, context);
	}

	protected registerRules(rules: BaseRule[]): void {
		this.rules = [...this.rules, ...rules];
	}

	private selectRules(user: User, entity: AuthorizableObject, context?: IAuthorizationContext): BaseRule[] {
		return this.rules.filter((publisher) => publisher.isApplicable(user, entity, context));
	}
}

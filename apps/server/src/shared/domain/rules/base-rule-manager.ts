import { InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { AuthorizableObjectType, IAuthorizationContext, IRule } from '../interface';
import { AuthorisationUtils } from './authorisation.utils';
import { BaseRule } from './base-rule';

export abstract class BaseRuleManager extends AuthorisationUtils implements IRule {
	protected rules: BaseRule[] = [];

	hasPermission(user: User, object: AuthorizableObjectType, context: IAuthorizationContext) {
		const rules = this.selectRules(user, object, context);
		const rule = this.matchSingleRule(rules);

		return rule.hasPermission(user, object, context);
	}

	protected registerRules(rules: BaseRule[]): void {
		this.rules = [...this.rules, ...rules];
	}

	private selectRules(user: User, object: AuthorizableObjectType, context?: IAuthorizationContext): BaseRule[] {
		return this.rules.filter((rule) => rule.isApplicable(user, object, context));
	}

	private matchSingleRule(rules: IRule[]) {
		if (rules.length === 0) {
			throw new NotImplementedException();
		}
		if (rules.length > 1) {
			throw new InternalServerErrorException('MULTIPLE_MATCHES_ARE_NOT_ALLOWED');
		}
		return rules[0];
	}
}

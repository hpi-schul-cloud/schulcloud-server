import { User } from '@modules/user/repo';
import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { BaseDO } from '@shared/domain/domainobject';
import type { AuthorizationContext, Rule } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';

@Injectable()
export class RuleManager {
	constructor(private readonly authorizationInjectionService: AuthorizationInjectionService) {}

	public selectRule(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): Rule {
		const rules = this.authorizationInjectionService.getAuthorizationRules();
		const selectedRules = rules.filter((rule) => rule.isApplicable(user, object, context));
		const rule = this.matchSingleRule(selectedRules);

		return rule;
	}

	private matchSingleRule(rules: Rule[]): Rule {
		if (rules.length === 0) {
			throw new NotImplementedException();
		}
		if (rules.length > 1) {
			throw new InternalServerErrorException('MULTIPLE_MATCHES_ARE_NOT_ALLOWED');
		}
		return rules[0];
	}
}

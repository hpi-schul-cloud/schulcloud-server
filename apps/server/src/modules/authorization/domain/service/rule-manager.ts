import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { BaseDO } from '@shared/domain/domainobject';
import type { AuthorizationContext, Rule } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';

@Injectable()
export class RuleManager {
	constructor(private readonly authorizationInjectionService: AuthorizationInjectionService) {}

	public selectRule(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): Rule[] {
		const rules = this.authorizationInjectionService.getAuthorizationRules();
		const selectedRules = rules.filter((rule) => rule.isApplicable(user, object, context));
		this.checkHasRule(selectedRules);

		return selectedRules;
	}

	private checkHasRule(rules: Rule[]): void {
		if (rules.length === 0) {
			throw new NotImplementedException();
		}
	}
}

import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { BaseDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import {
	CourseGroupRule,
	CourseRule,
	GroupRule,
	InstanceRule,
	LegacySchoolRule,
	LessonRule,
	SchoolRule,
	SchoolSystemOptionsRule,
	SubmissionRule,
	SystemRule,
	TaskRule,
	TeamRule,
	UserLoginMigrationRule,
	UserRule,
} from '../rules';
import { ExternalToolRule } from '../rules/external-tool.rule';
import type { AuthorizationContext, Rule } from '../type';
import { AuthorizationInjectionService } from './authorization-injection.service';

@Injectable()
export class RuleManager {
	constructor(
		courseGroupRule: CourseGroupRule,
		courseRule: CourseRule,
		groupRule: GroupRule,
		legaySchoolRule: LegacySchoolRule,
		lessonRule: LessonRule,
		schoolRule: SchoolRule,
		schoolSystemOptionsRule: SchoolSystemOptionsRule,
		submissionRule: SubmissionRule,
		systemRule: SystemRule,
		taskRule: TaskRule,
		teamRule: TeamRule,
		userLoginMigrationRule: UserLoginMigrationRule,
		userRule: UserRule,
		externalToolRule: ExternalToolRule,
		instanceRule: InstanceRule,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		this.authorizationInjectionService.injectAuthorizationRule(courseGroupRule);
		this.authorizationInjectionService.injectAuthorizationRule(courseRule);
		this.authorizationInjectionService.injectAuthorizationRule(groupRule);
		this.authorizationInjectionService.injectAuthorizationRule(legaySchoolRule);
		this.authorizationInjectionService.injectAuthorizationRule(lessonRule);
		this.authorizationInjectionService.injectAuthorizationRule(schoolRule);
		this.authorizationInjectionService.injectAuthorizationRule(schoolSystemOptionsRule);
		this.authorizationInjectionService.injectAuthorizationRule(submissionRule);
		this.authorizationInjectionService.injectAuthorizationRule(systemRule);
		this.authorizationInjectionService.injectAuthorizationRule(taskRule);
		this.authorizationInjectionService.injectAuthorizationRule(teamRule);
		this.authorizationInjectionService.injectAuthorizationRule(userLoginMigrationRule);
		this.authorizationInjectionService.injectAuthorizationRule(userRule);
		this.authorizationInjectionService.injectAuthorizationRule(externalToolRule);
		this.authorizationInjectionService.injectAuthorizationRule(instanceRule);
	}

	public selectRule(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): Rule {
		const rules = [...this.authorizationInjectionService.getAuthorizationRules()];
		const selectedRules = rules.filter((rule) => rule.isApplicable(user, object, context));
		const rule = this.matchSingleRule(selectedRules);

		return rule;
	}

	private matchSingleRule(rules: Rule[]) {
		if (rules.length === 0) {
			throw new NotImplementedException();
		}
		if (rules.length > 1) {
			throw new InternalServerErrorException('MULTIPLE_MATCHES_ARE_NOT_ALLOWED');
		}
		return rules[0];
	}
}

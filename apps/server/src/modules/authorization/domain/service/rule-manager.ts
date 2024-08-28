import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import { BaseDO } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import {
	BoardNodeRule,
	ContextExternalToolRule,
	CourseGroupRule,
	CourseRule,
	GroupRule,
	InstanceRule,
	LegacySchoolRule,
	LessonRule,
	SchoolExternalToolRule,
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
	private readonly rules: Rule[];

	constructor(
		private readonly boardNodeRule: BoardNodeRule,
		private readonly contextExternalToolRule: ContextExternalToolRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly courseRule: CourseRule,
		private readonly groupRule: GroupRule,
		private readonly legaySchoolRule: LegacySchoolRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolExternalToolRule: SchoolExternalToolRule,
		private readonly schoolRule: SchoolRule,
		private readonly schoolSystemOptionsRule: SchoolSystemOptionsRule,
		private readonly submissionRule: SubmissionRule,
		private readonly systemRule: SystemRule,
		private readonly taskRule: TaskRule,
		private readonly teamRule: TeamRule,
		private readonly userLoginMigrationRule: UserLoginMigrationRule,
		private readonly userRule: UserRule,
		private readonly externalToolRule: ExternalToolRule,
		private readonly instanceRule: InstanceRule,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		this.rules = [
			this.boardNodeRule,
			this.contextExternalToolRule,
			this.courseGroupRule,
			this.courseRule,
			this.groupRule,
			this.legaySchoolRule,
			this.lessonRule,
			this.schoolExternalToolRule,
			this.schoolRule,
			this.schoolSystemOptionsRule,
			this.submissionRule,
			this.systemRule,
			this.taskRule,
			this.teamRule,
			this.userLoginMigrationRule,
			this.userRule,
			this.externalToolRule,
			this.instanceRule,
		];
	}

	public selectRule(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): Rule {
		const rules = [...this.rules, ...this.authorizationInjectionService.getAuthorizationRules()];
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

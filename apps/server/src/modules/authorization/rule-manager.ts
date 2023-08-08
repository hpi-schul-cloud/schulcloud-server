import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { BaseDO, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import {
	BoardDoRule,
	CourseGroupRule,
	CourseRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SubmissionRule,
	TaskRule,
	TeamRule,
	UserRule,
} from '@shared/domain/rules';
import { ContextExternalToolRule } from '@shared/domain/rules/context-external-tool.rule';
import { AuthorizationContext, Rule } from './types';

@Injectable()
export class RuleManager {
	private readonly rules: Rule[];

	constructor(
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolRule: SchoolRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule,
		private readonly schoolExternalToolRule: SchoolExternalToolRule,
		private readonly boardDoRule: BoardDoRule,
		private readonly contextExternalToolRule: ContextExternalToolRule
	) {
		this.rules = [
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
			this.submissionRule,
			this.schoolExternalToolRule,
			this.boardDoRule,
			this.contextExternalToolRule,
		];
	}

	public selectRule(user: User, object: AuthorizableObject | BaseDO, context: AuthorizationContext): Rule {
		const selectedRules = this.rules.filter((rule) => rule.isApplicable(user, object, context));
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

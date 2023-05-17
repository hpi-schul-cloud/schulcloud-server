import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { BaseDO, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import {
	BoardNodeRule,
	CourseGroupRule,
	CourseRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SubmissionRule,
	TaskCardRule,
	TaskRule,
	TeamRule,
	UserRule,
} from '@shared/domain/rules';
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
		private readonly taskCardRule: TaskCardRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule,
		private readonly schoolExternalToolRule: SchoolExternalToolRule,
		private readonly boardNodeRule: BoardNodeRule
	) {
		this.rules = [
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.taskCardRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
			this.submissionRule,
			this.schoolExternalToolRule,
			this.boardNodeRule,
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

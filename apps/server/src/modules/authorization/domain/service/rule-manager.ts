import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { BaseDO, User } from '@shared/domain';
import { AuthorizableObject } from '@shared/domain/domain-object'; // fix import when it is avaible
import {
	BoardDoRule,
	ContextExternalToolRule,
	CourseGroupRule,
	CourseRule,
	LegacySchoolRule,
	LessonRule,
	SchoolExternalToolRule,
	SchoolRule,
	SubmissionRule,
	TaskRule,
	TeamRule,
	UserLoginMigrationRule,
	UserRule,
} from '../rules';
import type { AuthorizationContext, Rule } from '../type';

@Injectable()
export class RuleManager {
	private readonly rules: Rule[];

	constructor(
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly lessonRule: LessonRule,
		private readonly legaySchoolRule: LegacySchoolRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule,
		private readonly schoolExternalToolRule: SchoolExternalToolRule,
		private readonly boardDoRule: BoardDoRule,
		private readonly contextExternalToolRule: ContextExternalToolRule,
		private readonly userLoginMigrationRule: UserLoginMigrationRule,
		private readonly schoolRule: SchoolRule
	) {
		this.rules = [
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.teamRule,
			this.userRule,
			this.legaySchoolRule,
			this.submissionRule,
			this.schoolExternalToolRule,
			this.boardDoRule,
			this.contextExternalToolRule,
			this.userLoginMigrationRule,
			this.schoolRule,
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

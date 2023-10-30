import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { AuthorizableObject } from '@shared/domain/domain-object';
import { BaseDO } from '@shared/domain/domainobject/base.do';
import { User } from '@shared/domain/entity/user.entity';
import { BoardDoRule } from '@shared/domain/rules/board-do.rule';
import { ContextExternalToolRule } from '@shared/domain/rules/context-external-tool.rule';
import { CourseGroupRule } from '@shared/domain/rules/course-group.rule';
import { CourseRule } from '@shared/domain/rules/course.rule';
import { LegacySchoolRule } from '@shared/domain/rules/legacy-school.rule';
import { LessonRule } from '@shared/domain/rules/lesson.rule';
import { SchoolExternalToolRule } from '@shared/domain/rules/school-external-tool.rule';
import { SubmissionRule } from '@shared/domain/rules/submission.rule';
import { TaskRule } from '@shared/domain/rules/task.rule';
import { TeamRule } from '@shared/domain/rules/team.rule';
import { UserLoginMigrationRule } from '@shared/domain/rules/user-login-migration.rule';
import { UserRule } from '@shared/domain/rules/user.rule';
import { AuthorizationContext } from './types/authorization-context.interface';
import { Rule } from './types/rule.interface';

// fix import when it is avaible

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
		private readonly userLoginMigrationRule: UserLoginMigrationRule
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

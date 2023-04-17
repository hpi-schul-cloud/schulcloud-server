import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { User } from '@shared/domain/entity/user.entity';
import { CourseGroupRule } from './rules/course-group.rule';
import { CourseRule } from './rules/course.rule';
import { LessonRule } from './rules/lesson.rule';
import { SchoolExternalToolRule } from './rules/school-external-tool.rule';
import { SchoolRule } from './rules/school.rule';
import { SubmissionRule } from './rules/submission.rule';
import { TaskCardRule } from './rules/task-card.rule';
import { TaskRule } from './rules/task.rule';
import { TeamRule } from './rules/team.rule';
import { UserRule } from './rules/user.rule';
import { AuthorizableObject, AuthorizationContext } from './types';
import { Rule } from './types/rule.interface';

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
		private readonly schoolExternalToolRule: SchoolExternalToolRule
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
		];
	}

	public isAuthorized(user: User, object: AuthorizableObject, context: AuthorizationContext) {
		const selectedRules = this.rules.filter((rule) => rule.isApplicable(user, object, context));
		const rule = this.matchSingleRule(selectedRules);

		return rule.isAuthorized(user, object, context);
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

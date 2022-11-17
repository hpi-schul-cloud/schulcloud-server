import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { AuthorizableObjectType, IAuthorizationContext, IRule } from '../interface';
import { CourseGroupRule } from './course-group.rule';
import { CourseRule } from './course.rule';
import { LessonRule } from './lesson.rule';
import { SchoolRule } from './school.rule';
import { SubmissionRule } from './submission.rule';
import { TaskRule } from './task.rule';
import { TeamRule } from './team.rule';
import { UserRule } from './user.rule';

@Injectable()
export class RuleManager {
	private rules: IRule[] = [];

	constructor(
		private readonly courseRule: CourseRule,
		private readonly courseGroupRule: CourseGroupRule,
		private readonly lessonRule: LessonRule,
		private readonly schoolRule: SchoolRule,
		private readonly taskRule: TaskRule,
		private readonly userRule: UserRule,
		private readonly teamRule: TeamRule,
		private readonly submissionRule: SubmissionRule
	) {
		this.registerRules([
			this.courseRule,
			this.courseGroupRule,
			this.lessonRule,
			this.taskRule,
			this.teamRule,
			this.userRule,
			this.schoolRule,
			this.submissionRule,
		]);
	}

	hasPermission(user: User, object: AuthorizableObjectType, context: IAuthorizationContext) {
		const rules = this.selectRules(user, object, context);
		const rule = this.matchSingleRule(rules);

		return rule.hasPermission(user, object, context);
	}

	private registerRules(rules: IRule[]): void {
		this.rules = [...this.rules, ...rules];
	}

	private selectRules(user: User, object: AuthorizableObjectType, context?: IAuthorizationContext): IRule[] {
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

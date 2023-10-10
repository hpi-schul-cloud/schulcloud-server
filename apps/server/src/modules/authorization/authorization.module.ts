import { Module } from '@nestjs/common';
// import { ALL_RULES } from '@shared/domain/rules';

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

/*
import {
	BoardDoRule,
	ContextExternalToolRule,
	CourseGroupRule,
	CourseRule,
	LessonRule,
	SchoolExternalToolRule,
	SubmissionRule,
	TaskRule,
	TeamRule,
	UserRule,
	UserLoginMigrationRule,
	LegacySchoolRule,
} from '@shared/domain/rules';
*/
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { FeathersModule } from '@shared/infra/feathers';
import { AuthorizationHelper } from './domain/service/authorization.helper';
import { AuthorizationService } from './domain/service/authorization.service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { RuleManager } from './rule-manager';

@Module({
	imports: [FeathersModule, LoggerModule],
	providers: [
		FeathersAuthorizationService,
		FeathersAuthProvider,
		AuthorizationService,
		UserRepo,
		RuleManager,
		AuthorizationHelper,
		// rules
		BoardDoRule,
		ContextExternalToolRule,
		CourseGroupRule,
		CourseRule,
		LessonRule,
		SchoolExternalToolRule,
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
	],
	exports: [FeathersAuthorizationService, AuthorizationService, AuthorizationHelper],
})
export class AuthorizationModule {}

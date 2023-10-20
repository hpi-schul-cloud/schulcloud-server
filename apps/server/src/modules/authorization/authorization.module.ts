import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { FeathersModule } from '@shared/infra/feathers';
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
	SchoolRule,
} from './domain/rules';
import { AuthorizationHelper, AuthorizationService, RuleManager } from './domain';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';

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
		SchoolRule,
		SchoolExternalToolRule,
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
	],
	exports: [FeathersAuthorizationService, AuthorizationService],
})
export class AuthorizationModule {}

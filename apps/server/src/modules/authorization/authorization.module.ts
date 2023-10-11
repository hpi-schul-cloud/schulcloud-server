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
} from './domain/service/rules';
import { AuthorizationHelper, AuthorizationService } from './domain/service';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { RuleManager } from './domain/service/rule-manager';

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

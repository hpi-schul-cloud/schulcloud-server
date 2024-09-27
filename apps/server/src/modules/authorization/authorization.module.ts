import { FeathersModule } from '@infra/feathers';
import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationHelper, AuthorizationService, RuleManager, AuthorizationInjectionService } from './domain';
import {
	ContextExternalToolRule,
	CourseGroupRule,
	CourseRule,
	ExternalToolRule,
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
} from './domain/rules';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';

@Module({
	imports: [FeathersModule, LoggerModule],
	providers: [
		FeathersAuthorizationService,
		AuthorizationInjectionService,
		FeathersAuthProvider,
		AuthorizationService,
		UserRepo,
		RuleManager,
		AuthorizationHelper,
		// rules
		ContextExternalToolRule,
		CourseGroupRule,
		CourseRule,
		GroupRule,
		LessonRule,
		SchoolRule,
		SchoolExternalToolRule,
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
		SystemRule,
		SchoolSystemOptionsRule,
		ExternalToolRule,
		InstanceRule,
	],
	exports: [
		FeathersAuthorizationService,
		AuthorizationService,
		SystemRule, // Why export? This is a no go!
		AuthorizationInjectionService,
		AuthorizationHelper,
	],
})
export class AuthorizationModule {}

import { FeathersModule } from '@infra/feathers';
import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AuthorizationHelper, AuthorizationService, RuleManager } from './domain';
import {
	BoardDoRule,
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
	exports: [FeathersAuthorizationService, AuthorizationService, SystemRule],
})
export class AuthorizationModule {}

import { Module } from '@nestjs/common';
import { UserRepo, PermissionContextRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { FeathersModule } from '@infra/feathers';
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
	GroupRule,
} from './domain/rules';
import { AuthorizationHelper, AuthorizationService, RuleManager } from './domain';
import { FeathersAuthorizationService, FeathersAuthProvider } from './feathers';
import { PermissionContextService } from './permission-context/service/permission-context.service';

@Module({
	imports: [FeathersModule, LoggerModule],
	providers: [
		FeathersAuthorizationService,
		FeathersAuthProvider,
		AuthorizationService,
		PermissionContextService,
		UserRepo,
		PermissionContextRepo,
		RuleManager,
		AuthorizationHelper,
		// rules
		BoardDoRule,
		ContextExternalToolRule,
		CourseGroupRule,
		CourseRule,
		GroupRule,
		LessonRule,
		SchoolExternalToolRule,
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
	],
	exports: [FeathersAuthorizationService, AuthorizationService, PermissionContextService],
})
export class AuthorizationModule {}

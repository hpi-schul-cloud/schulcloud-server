import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import {
	CourseGroupRule,
	CourseRule,
	GroupRule,
	InstanceAdminRule,
	InstanceRule,
	LegacySchoolRule,
	LessonRule,
	SchoolInstanceOperationRule,
	SchoolRule,
	SchoolSystemOptionsRule,
	SubmissionRule,
	SystemRule,
	TaskRule,
	TeamRule,
	UserAdminRule,
	UserLoginMigrationRule,
	UserRule,
} from './rules';

@Module({
	imports: [AuthorizationModule],
	providers: [
		// rules
		CourseGroupRule,
		CourseRule,
		GroupRule,
		LessonRule,
		SchoolRule,
		SchoolInstanceOperationRule,
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserAdminRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
		SystemRule,
		SchoolSystemOptionsRule,
		InstanceRule,
		InstanceAdminRule,
	],
	exports: [
		SystemRule, // Why export? This is a no go!
	],
})
export class AuthorizationRulesModule {}

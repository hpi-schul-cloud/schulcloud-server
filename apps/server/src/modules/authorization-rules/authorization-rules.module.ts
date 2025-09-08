import { AuthorizationModule } from '@modules/authorization';
import { Module } from '@nestjs/common';
import {
	CourseGroupRule,
	CourseRule,
	GroupRule,
	InstanceRule,
	LegacySchoolRule,
	LessonRule,
	SchoolRule,
	SchoolSystemOptionsRule,
	SubmissionRule,
	SystemRule,
	TaskRule,
	TeamRule,
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
		SubmissionRule,
		TaskRule,
		TeamRule,
		UserRule,
		UserLoginMigrationRule,
		LegacySchoolRule,
		SystemRule,
		SchoolSystemOptionsRule,
		InstanceRule,
	],
	exports: [
		SystemRule, // Why export? This is a no go!
	],
})
export class AuthorizationRulesModule {}

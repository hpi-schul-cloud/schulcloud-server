import { Injectable } from '@nestjs/common';
import {
	BoardNodeRule,
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
} from '../rules';
import { AuthorizationInjectionService } from './authorization-injection.service';

@Injectable()
export class KnownRulesInjector {
	constructor(
		boardNodeRule: BoardNodeRule,
		contextExternalToolRule: ContextExternalToolRule,
		courseGroupRule: CourseGroupRule,
		courseRule: CourseRule,
		groupRule: GroupRule,
		legaySchoolRule: LegacySchoolRule,
		lessonRule: LessonRule,
		schoolExternalToolRule: SchoolExternalToolRule,
		schoolRule: SchoolRule,
		schoolSystemOptionsRule: SchoolSystemOptionsRule,
		submissionRule: SubmissionRule,
		systemRule: SystemRule,
		taskRule: TaskRule,
		teamRule: TeamRule,
		userLoginMigrationRule: UserLoginMigrationRule,
		userRule: UserRule,
		externalToolRule: ExternalToolRule,
		instanceRule: InstanceRule,
		private readonly authorizationInjectionService: AuthorizationInjectionService
	) {
		this.authorizationInjectionService.injectAuthorizationRule(boardNodeRule);
		this.authorizationInjectionService.injectAuthorizationRule(contextExternalToolRule);
		this.authorizationInjectionService.injectAuthorizationRule(courseGroupRule);
		this.authorizationInjectionService.injectAuthorizationRule(courseRule);
		this.authorizationInjectionService.injectAuthorizationRule(groupRule);
		this.authorizationInjectionService.injectAuthorizationRule(legaySchoolRule);
		this.authorizationInjectionService.injectAuthorizationRule(lessonRule);
		this.authorizationInjectionService.injectAuthorizationRule(schoolExternalToolRule);
		this.authorizationInjectionService.injectAuthorizationRule(schoolRule);
		this.authorizationInjectionService.injectAuthorizationRule(schoolSystemOptionsRule);
		this.authorizationInjectionService.injectAuthorizationRule(submissionRule);
		this.authorizationInjectionService.injectAuthorizationRule(systemRule);
		this.authorizationInjectionService.injectAuthorizationRule(taskRule);
		this.authorizationInjectionService.injectAuthorizationRule(teamRule);
		this.authorizationInjectionService.injectAuthorizationRule(userLoginMigrationRule);
		this.authorizationInjectionService.injectAuthorizationRule(userRule);
		this.authorizationInjectionService.injectAuthorizationRule(externalToolRule);
		this.authorizationInjectionService.injectAuthorizationRule(instanceRule);
	}
}

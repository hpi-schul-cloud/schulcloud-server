import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsEnum } from 'class-validator';

export enum TeacherVisibilityForExternalTeamInvitation {
	ENABLED = 'enabled',
	DISABLED = 'disabled',
	OPT_OUT = 'opt-out',
	OPT_IN = 'opt-in',
}

export const AUTHORIZATION_CONFIG_TOKEN = 'AUTHORIZATION_CONFIG_TOKEN';

@Configuration()
export class AuthorizationConfig {
	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsConfigurable = false;

	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsEnabledByDefault = true;

	@ConfigProperty('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')
	@IsEnum(TeacherVisibilityForExternalTeamInvitation)
	public teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.DISABLED;
}

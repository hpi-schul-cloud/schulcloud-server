import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { LanguageType } from '@shared/domain/interface';
import { IsBoolean, IsEnum } from 'class-validator';

export const USER_PUBLIC_API_CONFIG_TOKEN = 'USER_PUBLIC_API_CONFIG_TOKEN';
export const USER_CONFIG_TOKEN = 'USER_CONFIG_TOKEN';

export enum TeacherVisibilityForExternalTeamInvitation {
	ENABLED = 'enabled',
	DISABLED = 'disabled',
	OPT_OUT = 'opt-out',
	OPT_IN = 'opt-in',
}

@Configuration()
export class UserPublicApiConfig {
	@ConfigProperty('I18N__AVAILABLE_LANGUAGES')
	@CommaSeparatedStringToArray()
	@IsEnum(LanguageType, { each: true })
	public availableLanguages = [LanguageType.DE, LanguageType.EN, LanguageType.ES, LanguageType.UK];

	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsConfigurable = false;

	@ConfigProperty('TEACHER_STUDENT_VISIBILITY__IS_ENABLED_BY_DEFAULT')
	@IsBoolean()
	@StringToBoolean()
	public teacherStudentVisibilityIsEnabledByDefault = true;

	@ConfigProperty('CALENDAR_SERVICE_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public calendarServiceEnabled = true;
}

@Configuration()
export class UserConfig extends UserPublicApiConfig {
	@ConfigProperty('TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION')
	@IsEnum(TeacherVisibilityForExternalTeamInvitation)
	public teacherVisibilityForExternalTeamInvitation = TeacherVisibilityForExternalTeamInvitation.DISABLED;
}

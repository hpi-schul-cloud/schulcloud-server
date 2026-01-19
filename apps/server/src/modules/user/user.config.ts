import type { LoggerConfig } from '@core/logger';
import type { CalendarConfig } from '@infra/calendar';
import type { LegacySchoolConfig } from '@modules/legacy-school';
import type { RegistrationPinConfig } from '@modules/registration-pin';

export interface UserConfig extends LoggerConfig, RegistrationPinConfig, CalendarConfig, LegacySchoolConfig {
	AVAILABLE_LANGUAGES: string[];
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: string;
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: boolean;
}

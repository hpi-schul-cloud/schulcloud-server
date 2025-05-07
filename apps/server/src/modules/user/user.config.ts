import type { RoleConfig } from '@modules/role';
import type { LoggerConfig } from '@core/logger';
import type { CalendarConfig } from '@infra/calendar';
import type { AccountConfig } from '@modules/account';
import type { RegistrationPinConfig } from '@modules/registration-pin';
import type { LegacySchoolConfig } from '@modules/legacy-school';

export interface UserConfig
	extends RoleConfig,
		AccountConfig,
		LoggerConfig,
		RegistrationPinConfig,
		CalendarConfig,
		LegacySchoolConfig {
	AVAILABLE_LANGUAGES: string[];
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: string;
}

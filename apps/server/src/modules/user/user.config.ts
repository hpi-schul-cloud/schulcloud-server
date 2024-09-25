import { RoleConfig } from '@modules/role';
import { LoggerConfig } from '@src/core/logger';
import { CalendarConfig } from '@infra/calendar';
import { AccountConfig } from '@modules/account';
import { RegistrationPinConfig } from '@modules/registration-pin';
import { LegacySchoolConfig } from '../legacy-school';

export interface UserConfig
	extends RoleConfig,
		AccountConfig,
		LoggerConfig,
		RegistrationPinConfig,
		CalendarConfig,
		LegacySchoolConfig {
	AVAILABLE_LANGUAGES: string[];
}

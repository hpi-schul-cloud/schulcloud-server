import { ConsoleWriterConfig } from '@infra/console';
import { UserConfig } from '@modules/user';
import { AccountConfig } from '@modules/account';
import { Configuration } from '@hpi-schul-cloud/commons';
import { LanguageType } from '@shared/domain/interface';

export interface DeletionConsoleConfig extends ConsoleWriterConfig, UserConfig, AccountConfig {
	ADMIN_API_CLIENT_BASE_URL: string;
	ADMIN_API_CLIENT_API_KEY: string;
}

const config: DeletionConsoleConfig = {
	ADMIN_API_CLIENT_BASE_URL: Configuration.get('ADMIN_API_CLIENT__BASE_URL') as string,
	ADMIN_API_CLIENT_API_KEY: Configuration.get('ADMIN_API_CLIENT__API_KEY') as string,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED') as boolean,
	FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: Configuration.get('FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED') as boolean,
	NEST_LOG_LEVEL: Configuration.get('NEST_LOG_LEVEL') as string,
	EXIT_ON_ERROR: Configuration.get('EXIT_ON_ERROR') as boolean,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
};

export const deletionConsoleConfig = () => config;

import { Configuration } from '@hpi-schul-cloud/commons';
import { ConsoleWriterConfig } from '@infra/console';
import { RabbitMqConfig } from '@infra/rabbitmq';
import { SchulconnexClientConfig } from '@infra/schulconnex-client';
import { SynchronizationConfig } from '@modules/synchronization';
import { UserConfig } from '@modules/user';
import { LanguageType } from '@shared/domain/interface';

export interface IdpConsoleConfig
	extends ConsoleWriterConfig,
		RabbitMqConfig,
		UserConfig,
		SynchronizationConfig,
		SchulconnexClientConfig {
	SYNCHRONIZATION_CHUNK: number;
	LOGIN_BLOCK_TIME: number; // @TODO temporary until removed from other configs
}

const config: IdpConsoleConfig = {
	SYNCHRONIZATION_CHUNK: Configuration.get('SYNCHRONIZATION_CHUNK') as number,
	LOGIN_BLOCK_TIME: Configuration.get('LOGIN_BLOCK_TIME') as number,
	TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE: Configuration.get(
		'TEACHER_STUDENT_VISIBILITY__IS_CONFIGURABLE'
	) as boolean,
	AVAILABLE_LANGUAGES: (Configuration.get('I18N__AVAILABLE_LANGUAGES') as string).split(',') as LanguageType[],
	TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION: Configuration.get(
		'TEACHER_VISIBILITY_FOR_EXTERNAL_TEAM_INVITATION'
	) as string,
	SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSON_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__PERSONEN_INFO_TIMEOUT_IN_MS'
	) as number,
	SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS: Configuration.get(
		'SCHULCONNEX_CLIENT__POLICIES_INFO_TIMEOUT_IN_MS'
	) as number,
	RABBITMQ_URI: Configuration.get('RABBITMQ_URI') as string,
	CALENDAR_SERVICE_ENABLED: Configuration.get('CALENDAR_SERVICE_ENABLED') as boolean,
};

export const idpConsoleConfigConfig = () => config;

import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';

export interface AdminApiServerConfig extends CoreModuleConfig, LegacySchoolConfig, RegistrationPinConfig {
	ROCKET_CHAT_URI: string;
	ROCKET_CHAT_ADMIN_ID: string;
	ROCKET_CHAT_ADMIN_TOKEN: string;
}

const config: AdminApiServerConfig = {
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const adminApiServerConfig = () => config;

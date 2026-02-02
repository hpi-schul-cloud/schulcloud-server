import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';

export interface AdminApiServerConfig extends LegacySchoolConfig, RegistrationPinConfig {
	ROCKET_CHAT_URI: string;
	ROCKET_CHAT_ADMIN_ID: string;
	ROCKET_CHAT_ADMIN_TOKEN: string;
}

const config: AdminApiServerConfig = {
	ROCKET_CHAT_URI: Configuration.get('ROCKET_CHAT_URI') as string,
	ROCKET_CHAT_ADMIN_ID: Configuration.get('ROCKET_CHAT_ADMIN_ID') as string,
	ROCKET_CHAT_ADMIN_TOKEN: Configuration.get('ROCKET_CHAT_ADMIN_TOKEN') as string,
};

export const adminApiServerConfig = () => config;

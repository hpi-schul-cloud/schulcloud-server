import type { CoreModuleConfig } from '@core/core.config';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';

export interface AdminApiServerConfig extends CoreModuleConfig, LegacySchoolConfig, RegistrationPinConfig {}

const config: AdminApiServerConfig = {
	INCOMING_REQUEST_TIMEOUT: Configuration.get('INCOMING_REQUEST_TIMEOUT_API') as number,
};

export const adminApiServerConfig = () => config;

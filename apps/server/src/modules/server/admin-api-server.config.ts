import { LegacySchoolConfig } from '@modules/legacy-school';
import { RegistrationPinConfig } from '@modules/registration-pin';

export interface AdminApiServerConfig extends LegacySchoolConfig, RegistrationPinConfig {}

const config: AdminApiServerConfig = {};

export const adminApiServerConfig = () => config;

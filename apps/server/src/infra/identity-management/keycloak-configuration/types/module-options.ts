import { EncryptionConfig } from '@infra/encryption';
import { KeycloakAdministrationConfig } from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakConfigurationConfig } from '../keycloak-configuration.config';

export interface KeycloakConfigurationModuleOptions {
	encryptionConfig: { configInjectionToken: string; configConstructor: new () => EncryptionConfig };
	keycloakAdministrationConfig: {
		configInjectionToken: string;
		configConstructor: new () => KeycloakAdministrationConfig;
	};
	keycloakConfigurationConfig: {
		configInjectionToken: string;
		configConstructor: new () => KeycloakConfigurationConfig;
	};
}

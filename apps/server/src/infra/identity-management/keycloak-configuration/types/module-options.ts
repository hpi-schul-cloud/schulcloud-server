import { EncryptionConfig } from '@infra/encryption';
import { KeycloakAdministrationConfig } from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakConfigurationConfig } from '../keycloak-configuration.config';

export interface KeycloakConfigurationModuleOptions {
	encryptionConfig: { injectionToken: string; Constructor: new () => EncryptionConfig };
	keycloakAdministrationConfig: { injectionToken: string; Constructor: new () => KeycloakAdministrationConfig };
	keycloakConfigurationConfig: { injectionToken: string; Constructor: new () => KeycloakConfigurationConfig };
}

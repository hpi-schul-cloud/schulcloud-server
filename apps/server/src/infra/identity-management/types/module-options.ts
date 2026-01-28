import { EncryptionConfig } from '@infra/encryption';
import { KeycloakAdministrationConfig } from '../keycloak-administration/keycloak-administration.config';

export interface IdentityManagementModuleOptions {
	encryptionConfig: { injectionToken: string; Constructor: new () => EncryptionConfig };
	keycloakAdministrationConfig: { injectionToken: string; Constructor: new () => KeycloakAdministrationConfig };
}

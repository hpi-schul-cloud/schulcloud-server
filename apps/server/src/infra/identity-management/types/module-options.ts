import { EncryptionConfig } from '@infra/encryption';
import { IdentityManagementConfig } from '../identity-management.config';
import { KeycloakAdministrationConfig } from '../keycloak-administration';

export interface IdentityManagementModuleOptions {
	encryptionConfig: { injectionToken: string; Constructor: new () => EncryptionConfig };
	identityManagementConfig: { injectionToken: string; Constructor: new () => IdentityManagementConfig };
	keycloakAdministrationConfig: { injectionToken: string; Constructor: new () => KeycloakAdministrationConfig };
}

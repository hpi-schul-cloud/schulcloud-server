import { EncryptionConfig } from '@infra/encryption';
import { KeycloakAdministrationConfig } from '../keycloak-administration/keycloak-administration.config';

export interface IdentityManagementModuleOptions {
	encryptionConfig: { configInjectionToken: string; configConstructor: new () => EncryptionConfig };
	keycloakAdministrationConfig: {
		configInjectionToken: string;
		configConstructor: new () => KeycloakAdministrationConfig;
	};
}

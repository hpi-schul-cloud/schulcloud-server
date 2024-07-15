import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IKeycloakSettings } from './interface/keycloak-settings.interface';

export default class KeycloakAdministration {
	static keycloakSettings = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
		? ({
				internalBaseUrl: Configuration.get('IDENTITY_MANAGEMENT__INTERNAL_URI') as string,
				externalBaseUrl: Configuration.get('IDENTITY_MANAGEMENT__EXTERNAL_URI') as string,
				realmName: Configuration.get('IDENTITY_MANAGEMENT__TENANT') as string,
				clientId: Configuration.get('IDENTITY_MANAGEMENT__CLIENTID') as string,
				credentials: {
					grantType: 'password',
					username: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_USER') as string,
					password: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_PASSWORD') as string,
					clientId: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_CLIENTID') as string,
				},
		  } as IKeycloakSettings)
		: ({} as IKeycloakSettings);
}

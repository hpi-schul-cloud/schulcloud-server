import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { IKeycloakManagementInputFiles } from './interface/keycloak-management-input-files.interface';
import { IKeycloakSettings } from './interface/keycloak-settings.interface';

export default class KeycloakConfiguration {
	static keycloakSettings = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
		? ({
				baseUrl: Configuration.get('IDENTITY_MANAGEMENT__URI') as string,
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

	static keycloakInputFiles = {
		accountsFile: './backup/setup/accounts.json',
		usersFile: './backup/setup/users.json',
	} as IKeycloakManagementInputFiles;
}

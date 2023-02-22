import { IKeycloakConfigurationInputFiles } from './interface/keycloak-configuration-input-files.interface';

export default class KeycloakConfiguration {
	static keycloakInputFiles = {
		accountsFile: './backup/setup/accounts.json',
		usersFile: './backup/setup/users.json',
	} as IKeycloakConfigurationInputFiles;
}

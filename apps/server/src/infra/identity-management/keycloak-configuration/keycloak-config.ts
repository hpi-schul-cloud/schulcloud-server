import { KeycloakConfigurationInputFilesInterface } from './interface/keycloak-configuration-input-files.interface';

export default class KeycloakConfiguration {
	static keycloakInputFiles: KeycloakConfigurationInputFilesInterface = {
		accountsFile: './backup/setup/accounts.json',
		usersFile: './backup/setup/users.json',
	};
}

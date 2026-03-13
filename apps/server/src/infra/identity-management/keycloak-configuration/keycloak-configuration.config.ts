import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString } from 'class-validator';

export const KEYCLOAK_CONFIGURATION_CONFIG_TOKEN = 'KEYCLOAK_CONFIGURATION_CONFIG_TOKEN';

@Configuration()
export class KeycloakConfigurationConfig {
	@ConfigProperty('KEYCLOAK_ACCOUNTS_FILE')
	@IsString()
	public accountsFile = './backup/setup/accounts.json';

	@ConfigProperty('KEYCLOAK_USERS_FILE')
	@IsString()
	public usersFile = './backup/setup/users.json';

	@ConfigProperty('SC_DOMAIN')
	@IsString()
	public scDomain!: string;
}

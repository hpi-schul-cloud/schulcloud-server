import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString, IsUrl } from 'class-validator';

export const KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN = 'KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN';

@Configuration()
export class KeycloakAdministrationConfig {
	@ConfigProperty('FEATURE_IDENTITY_MANAGEMENT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public identityManagementEnabled = false;

	@ConfigProperty('IDENTITY_MANAGEMENT__INTERNAL_URI')
	@IsUrl({ require_tld: false })
	public internalBaseUrl!: string;

	@ConfigProperty('IDENTITY_MANAGEMENT__EXTERNAL_URI')
	@IsUrl({ require_tld: false })
	public externalBaseUrl!: string;

	@ConfigProperty('IDENTITY_MANAGEMENT__TENANT')
	@IsString()
	public realmName!: string;

	@ConfigProperty('IDENTITY_MANAGEMENT__CLIENTID')
	@IsString()
	public clientId!: string;

	public get credentials(): {
		grantType: 'password';
		username: string;
		password: string;
		clientId: string;
	} {
		return {
			grantType: 'password' as const,
			username: this.adminUsername,
			password: this.adminPassword,
			clientId: this.adminClientId,
		};
	}

	@ConfigProperty('IDENTITY_MANAGEMENT__ADMIN_USER')
	@IsString()
	private adminUsername!: string;

	@ConfigProperty('IDENTITY_MANAGEMENT__ADMIN_PASSWORD')
	@IsString()
	private adminPassword!: string;

	@ConfigProperty('IDENTITY_MANAGEMENT__ADMIN_CLIENTID')
	@IsString()
	private adminClientId!: string;
}

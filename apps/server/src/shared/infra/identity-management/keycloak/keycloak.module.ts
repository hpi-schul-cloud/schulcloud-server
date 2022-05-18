import { Module } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@shared/infra/console';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { IKeycloakSettings, KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementController } from './controller/keycloak-management.controller';
import { IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from './interface';

const keycloakConfiguration = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
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

@Module({
	imports: [ConsoleWriterModule],
	controllers: [KeycloakManagementController],
	providers: [
		KeycloakAdminClient,
		KeycloakAdministrationService,
		{
			provide: KeycloakSettings,
			useValue: keycloakConfiguration,
		},
		{
			provide: KeycloakManagementInputFiles,
			useValue: {
				accountsFile: './backup/setup/accounts.json',
				usersFile: './backup/setup/users.json',
			} as IKeycloakManagementInputFiles,
		},
		KeycloakManagementUc,
		KeycloakConsole,
	],
	exports: [KeycloakAdministrationService, KeycloakConsole],
})
export class KeycloakModule {}

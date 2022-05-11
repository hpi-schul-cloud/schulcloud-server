import { Module } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule, ConsoleWriterService } from '@shared/infra/console';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { IKeycloakSettings, KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';

@Module({
	imports: [ConsoleWriterModule],
	providers: [
		KeycloakAdminClient,
		KeycloakAdministrationService,
		{
			provide: KeycloakSettings,
			useValue: {
				baseUrl: Configuration.get('IDENTITY_MANAGEMENT__URI') as string,
				realmName: Configuration.get('IDENTITY_MANAGEMENT__TENANT') as string,
				clientId: Configuration.get('IDENTITY_MANAGEMENT__CLIENTID') as string,
				credentials: {
					grantType: 'password',
					username: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_USER') as string,
					password: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_PASSWORD') as string,
					clientId: Configuration.get('IDENTITY_MANAGEMENT__ADMIN_CLIENTID') as string,
				},
			} as IKeycloakSettings,
		},
		KeycloakManagementUc,
		KeycloakConsole,
	],
	exports: [KeycloakAdministrationService, KeycloakConsole],
})
export class KeycloakModule {}

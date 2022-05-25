import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { LoggerModule } from '@src/core/logger';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementController } from './controller/keycloak-management.controller';
import { KeycloakManagementInputFiles } from './interface';
import KeycloakConfiguration from './keycloak-config';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	controllers: [KeycloakManagementController],
	providers: [
		KeycloakAdminClient,
		KeycloakAdministrationService,
		{
			provide: KeycloakSettings,
			useValue: KeycloakConfiguration.keycloakSettings,
		},
		{
			provide: KeycloakManagementInputFiles,
			useValue: KeycloakConfiguration.keycloakInputFiles,
		},
		KeycloakManagementUc,
		KeycloakConsole,
	],
	exports: [KeycloakAdministrationService, KeycloakConsole],
})
export class KeycloakModule {}

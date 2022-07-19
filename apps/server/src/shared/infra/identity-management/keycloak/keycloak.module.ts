import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { LoggerModule } from '@src/core/logger';
import { SystemRepo } from '@shared/repo';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementController } from './controller/keycloak-management.controller';
import { KeycloakManagementInputFiles } from './interface';
import KeycloakConfiguration from './keycloak-config';

@Module({
	imports: [ConsoleWriterModule, LoggerModule],
	controllers: [KeycloakManagementController],
	providers: [
		SystemRepo,
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
		KeycloakConfigurationService,
		KeycloakSeedService,
	],
	exports: [KeycloakConsole],
})
export class KeycloakModule {}

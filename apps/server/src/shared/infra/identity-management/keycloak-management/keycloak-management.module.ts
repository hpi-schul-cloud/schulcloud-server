import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console';
import { SystemModule } from '@src/modules';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakManagementController } from './controller/keycloak-management.controller';
import { KeycloakManagementInputFiles } from './interface/keycloak-management-input-files.interface';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import KeycloakConfiguration from './keycloak-config';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

@Module({
	imports: [ConsoleWriterModule, SystemModule],
	controllers: [KeycloakManagementController],
	providers: [
		KeycloakAdminClient,
		{
			provide: KeycloakSettings,
			useValue: KeycloakConfiguration.keycloakSettings,
		},
		{
			provide: KeycloakManagementInputFiles,
			useValue: KeycloakConfiguration.keycloakInputFiles,
		},
		KeycloakConsole,
		KeycloakAdministrationService,
		KeycloakConfigurationService,
		KeycloakSeedService,
		OidcIdentityProviderMapper,
	],
	exports: [KeycloakConsole, KeycloakAdministrationService, KeycloakConfigurationService, KeycloakSeedService],
})
export class KeycloakManagementModule {}

import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { SystemRepo } from '@shared/repo';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { EncryptionModule } from '@shared/infra/encryption';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementInputFiles } from './interface';
import KeycloakConfiguration from './keycloak-config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

@Module({
	imports: [LoggerModule, EncryptionModule],
	controllers: [],
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
		KeycloakConfigurationService,
		KeycloakSeedService,
	],
	exports: [KeycloakAdministrationService, KeycloakManagementUc],
})
export class KeycloakModule {}

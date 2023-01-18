import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { EncryptionModule } from '@shared/infra/encryption';
import { HttpModule } from '@nestjs/axios';
import { SystemModule } from '../../../../modules/system/system.module';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementInputFiles } from './interface';
import KeycloakConfiguration from './keycloak-config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakPasswordCredentialsService } from './service/keycloak-password-credentials.service';

@Module({
	imports: [LoggerModule, EncryptionModule, SystemModule, HttpModule],
	controllers: [],
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
		OidcIdentityProviderMapper,
		KeycloakConfigurationService,
		KeycloakSeedService,
		KeycloakPasswordCredentialsService,
	],
	exports: [KeycloakAdministrationService, KeycloakManagementUc, KeycloakPasswordCredentialsService],
})
export class KeycloakModule {}

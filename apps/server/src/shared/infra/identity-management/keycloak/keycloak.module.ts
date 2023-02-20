import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { EncryptionModule } from '@shared/infra/encryption';
import { LoggerModule } from '@src/core/logger';
import { SystemModule } from '../../../../modules/system/system.module';
import { KeycloakManagementInputFiles } from './interface';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import KeycloakConfiguration from './keycloak-config';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';

@Module({
	imports: [LoggerModule, EncryptionModule, forwardRef(() => SystemModule), HttpModule],
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
		KeycloakIdentityManagementOauthService,
	],
	exports: [KeycloakAdministrationService, KeycloakManagementUc, KeycloakIdentityManagementOauthService],
})
export class KeycloakModule {}

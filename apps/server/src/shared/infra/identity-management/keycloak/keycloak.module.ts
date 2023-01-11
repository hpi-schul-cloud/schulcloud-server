import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { EncryptionModule } from '@shared/infra/encryption';
import { HttpModule } from '@nestjs/axios';
import { SystemModule } from '../../../../modules/system/system.module';
import { KeycloakSettings } from './interface/keycloak-settings.interface';
import { KeycloakAdminClient } from './interface/keycloak-admin-client.interface';
import { KeycloakManagementUc } from './uc/Keycloak-management.uc';
import { KeycloakManagementInputFiles } from './interface';
import KeycloakConfiguration from './keycloak-config';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';

@Module({
	imports: [LoggerModule, EncryptionModule, SystemModule, HttpModule],
	controllers: [],
	providers: [
		{
			provide: 'test',
			useFactory: () => '1',
		},
		{
			provide: KeycloakAdminClient,
			useFactory: async () => {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-eval
				const { default: KcLib } = await eval("import('@keycloak/keycloak-admin-client')");
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
				return new KcLib();
			},
		},
		{
			provide: KeycloakSettings,
			useValue: KeycloakConfiguration.keycloakSettings,
		},
		{
			provide: KeycloakManagementInputFiles,
			useValue: KeycloakConfiguration.keycloakInputFiles,
		},
		KeycloakAdministrationService,
		KeycloakManagementUc,
		OidcIdentityProviderMapper,
		KeycloakConfigurationService,
		KeycloakSeedService,
	],
	exports: [KeycloakAdministrationService, KeycloakManagementUc],
})
export class KeycloakModule {}

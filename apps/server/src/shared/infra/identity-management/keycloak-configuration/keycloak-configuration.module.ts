import { Module } from '@nestjs/common';
import { ConsoleWriterModule } from '@shared/infra/console/console-writer/console-writer.module';
import { EncryptionModule } from '@shared/infra/encryption/encryption.module';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from '@src/modules/account/account.module';
import { SystemModule } from '@src/modules/system/system.module';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakConsole } from './console/keycloak-configuration.console';
import { KeycloakManagementController } from './controller/keycloak-configuration.controller';
import { KeycloakConfigurationInputFiles } from './interface/keycloak-configuration-input-files.interface';

import KeycloakConfiguration from './keycloak-config';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakMigrationService } from './service/keycloak-migration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { KeycloakConfigurationUc } from './uc/keycloak-configuration.uc';

@Module({
	imports: [
		KeycloakAdministrationModule,
		LoggerModule,
		EncryptionModule,
		ConsoleWriterModule,
		SystemModule,
		AccountModule,
	],
	controllers: [KeycloakManagementController],
	providers: [
		{
			provide: KeycloakConfigurationInputFiles,
			useValue: KeycloakConfiguration.keycloakInputFiles,
		},
		OidcIdentityProviderMapper,
		KeycloakConfigurationUc,
		KeycloakConfigurationService,
		KeycloakMigrationService,
		KeycloakSeedService,
		KeycloakConsole,
	],
	exports: [KeycloakConsole, KeycloakConfigurationService, KeycloakSeedService],
})
export class KeycloakConfigurationModule {}

import { LoggerModule } from '@core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { AccountModule } from '@modules/account';
import { SystemModule } from '@modules/system';
import { DynamicModule, Module } from '@nestjs/common';
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

@Module({})
export class KeycloakConfigurationModule {
	public static register<T extends EncryptionConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		return {
			module: KeycloakConfigurationModule,
			imports: [
				KeycloakAdministrationModule,
				LoggerModule,
				EncryptionModule.register(constructor, configInjectionToken),
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
		};
	}
}

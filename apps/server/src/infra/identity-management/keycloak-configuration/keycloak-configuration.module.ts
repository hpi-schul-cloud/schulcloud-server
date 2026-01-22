import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration/configuration.module';
import { ConsoleWriterModule } from '@infra/console';
import { EncryptionConfig, EncryptionModule } from '@infra/encryption';
import { AccountModule } from '@modules/account';
import { SystemModule } from '@modules/system';
import { DynamicModule, Module } from '@nestjs/common';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakConsole } from './console/keycloak-configuration.console';
import { KeycloakManagementController } from './controller/keycloak-configuration.controller';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from './keycloak-configuration-config';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakMigrationService } from './service/keycloak-migration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { KeycloakConfigurationUc } from './uc/keycloak-configuration.uc';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../keycloak-administration/keycloak-administration-config';

@Module({})
export class KeycloakConfigurationModule {
	public static register<T extends EncryptionConfig>(
		constructor: new () => T,
		configInjectionToken: string
	): DynamicModule {
		return {
			module: KeycloakConfigurationModule,
			imports: [
				ConfigurationModule.register(KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig),
				KeycloakAdministrationModule.register(KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN, KeycloakAdministrationConfig),
				LoggerModule,
				EncryptionModule.register(constructor, configInjectionToken),
				ConsoleWriterModule,
				SystemModule,
				AccountModule,
			],
			controllers: [KeycloakManagementController],
			providers: [
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

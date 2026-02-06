import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterModule } from '@infra/console';
import { EncryptionModule } from '@infra/encryption';
import { AccountModule } from '@modules/account';
import { SystemModule } from '@modules/system';
import { DynamicModule, Module } from '@nestjs/common';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module';
import { KeycloakConsole } from './console/keycloak-configuration.console';
import { KeycloakManagementController } from './controller/keycloak-configuration.controller';
import { OidcIdentityProviderMapper } from './mapper/identity-provider.mapper';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakMigrationService } from './service/keycloak-migration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';
import { KeycloakConfigurationModuleOptions } from './types/module-options';
import { KeycloakConfigurationUc } from './uc/keycloak-configuration.uc';

@Module({})
export class KeycloakConfigurationModule {
	public static register(options: KeycloakConfigurationModuleOptions): DynamicModule {
		const { encryptionConfig, keycloakAdministrationConfig, keycloakConfigurationConfig } = options;

		return {
			module: KeycloakConfigurationModule,
			imports: [
				ConfigurationModule.register(
					keycloakConfigurationConfig.configInjectionToken,
					keycloakConfigurationConfig.configConstructor
				),
				KeycloakAdministrationModule.register(
					keycloakAdministrationConfig.configInjectionToken,
					keycloakAdministrationConfig.configConstructor
				),
				LoggerModule,
				EncryptionModule.register(encryptionConfig.configInjectionToken, encryptionConfig.configConstructor),
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

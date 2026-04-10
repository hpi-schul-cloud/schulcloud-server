import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterService } from '@infra/console';
import { EncryptionModule } from '@infra/encryption';
import { FeathersModule } from '@infra/feathers';
import { FileSystemModule } from '@infra/file-system';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management/keycloak-administration/keycloak-administration.config';
import {
	KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
	KeycloakConfigurationConfig,
} from '@infra/identity-management/keycloak-configuration/keycloak-configuration.config';
import { KeycloakConfigurationModule } from '@infra/identity-management/keycloak-configuration/keycloak-configuration.module';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { OauthProviderServiceModule } from '@modules/oauth-provider';
import { SystemModule } from '@modules/system';
import { ExternalToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { InstanceModule } from '../instance';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import { MANAGMENT_ENCRYPTION_CONFIG_TOKEN, ManagmentEncryptionConfig } from './encryption.config';
import { MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig } from './management-seed-data.config';
import {
	ExternalToolsSeedDataService,
	InstancesSeedDataService,
	MediaSourcesSeedDataService,
	SystemsSeedDataService,
} from './service';
import { DatabaseManagementService } from './service/database-management.service';
import { DatabaseManagementUc } from './uc/database-management.uc';

const imports = [
	FileSystemModule,
	LoggerModule,
	ConfigurationModule.register(MANAGEMENT_SEED_DATA_CONFIG_TOKEN, ManagementSeedDataConfig),
	EncryptionModule.register(MANAGMENT_ENCRYPTION_CONFIG_TOKEN, ManagmentEncryptionConfig),
	FeathersModule,
	MediaSourceModule,
	SystemModule,
	ExternalToolModule,
	OauthProviderServiceModule,
	InstanceModule,
	KeycloakConfigurationModule.register({
		encryptionConfig: {
			configInjectionToken: MANAGMENT_ENCRYPTION_CONFIG_TOKEN,
			configConstructor: ManagmentEncryptionConfig,
		},
		keycloakAdministrationConfig: {
			configInjectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
			configConstructor: KeycloakAdministrationConfig,
		},
		keycloakConfigurationConfig: {
			configInjectionToken: KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
			configConstructor: KeycloakConfigurationConfig,
		},
	}),
];

const providers = [
	DatabaseManagementUc,
	DatabaseManagementService,
	BsonConverter,
	// console providers
	DatabaseManagementConsole,
	// infra services
	ConsoleWriterService,
	// seed data services
	MediaSourcesSeedDataService,
	SystemsSeedDataService,
	ExternalToolsSeedDataService,
	InstancesSeedDataService,
];

const controllers = [DatabaseManagementController];

@Module({
	imports: [...imports],
	providers,
	controllers,
})
export class ManagementModule {}

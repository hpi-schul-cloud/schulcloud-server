import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterService } from '@infra/console';
import { EncryptionModule } from '@infra/encryption';
import { FeathersModule } from '@infra/feathers';
import { FileSystemModule } from '@infra/file-system';
import { KeycloakConfigurationModule } from '@infra/identity-management/keycloak-configuration/keycloak-configuration.module';
import { EncryptionConfig } from '@modules/account/encryption.config';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { OauthProviderServiceModule } from '@modules/oauth-provider';
import { serverConfig } from '@modules/server';
import { SystemModule } from '@modules/system';
import { ExternalToolModule } from '@modules/tool';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { InstanceModule } from '../instance';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import {
	ExternalToolsSeedDataService,
	InstancesSeedDataService,
	MediaSourcesSeedDataService,
	SystemsSeedDataService,
} from './service';
import { DatabaseManagementService } from './service/database-management.service';
import { DatabaseManagementUc } from './uc/database-management.uc';

const baseImports = [
	FileSystemModule,
	LoggerModule,
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	EncryptionModule.register(EncryptionConfig),
	FeathersModule,
	MediaSourceModule,
	SystemModule,
	ExternalToolModule,
	OauthProviderServiceModule,
	InstanceModule,
];

const imports = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
	? [...baseImports, KeycloakConfigurationModule.register(EncryptionConfig)]
	: baseImports;

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

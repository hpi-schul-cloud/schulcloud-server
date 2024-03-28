import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterService } from '@infra/console';
import { DatabaseManagementModule, DatabaseManagementService } from '@infra/database';
import { EncryptionModule } from '@infra/encryption';
import { FileSystemModule } from '@infra/file-system';
import { KeycloakConfigurationModule } from '@infra/identity-management/keycloak-configuration/keycloak-configuration.module';
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { LoggerModule } from '@src/core/logger';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import { DatabaseManagementUc } from './uc/database-management.uc';

const baseImports = [
	FileSystemModule,
	DatabaseManagementModule,
	LoggerModule,
	ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
	EncryptionModule,
];

const imports = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
	? [...baseImports, KeycloakConfigurationModule]
	: baseImports;

const providers = [
	DatabaseManagementUc,
	DatabaseManagementService,
	BsonConverter,
	// console providers
	DatabaseManagementConsole,
	// infra services
	ConsoleWriterService,
];

const controllers = [DatabaseManagementController];

@Module({
	imports: [...imports],
	providers,
	controllers,
})
export class ManagementModule {}

import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterService } from '@shared/infra/console/console-writer/console-writer.service';
import { DatabaseManagementModule } from '@shared/infra/database/management/database-management.module';
import { DatabaseManagementService } from '@shared/infra/database/management/database-management.service';
import { EncryptionModule } from '@shared/infra/encryption/encryption.module';
import { FileSystemModule } from '@shared/infra/file-system/file-system.module';
import { KeycloakConfigurationModule } from '@shared/infra/identity-management/keycloak-configuration/keycloak-configuration.module';
import { createConfigModuleOptions } from '@src/config/config-module-options';
import { LoggerModule } from '@src/core/logger/logger.module';
import { serverConfig } from '../server/server.config';
import { BoardManagementConsole } from './console/board-management.console';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import { BoardManagementUc } from './uc/board-management.uc';
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
	BoardManagementConsole,
	BoardManagementUc,
];

const controllers = [DatabaseManagementController];

@Module({
	imports: [...imports],
	providers,
	controllers,
})
export class ManagementModule {}

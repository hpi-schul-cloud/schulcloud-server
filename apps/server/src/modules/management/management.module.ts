import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsoleWriterService } from '@shared/infra/console';
import { DatabaseManagementModule, DatabaseManagementService } from '@shared/infra/database';
import { FileSystemModule } from '@shared/infra/file-system';
import { KeycloakControllerModule } from '@shared/infra/identity-management/keycloak/controller/keycloak.controller.module';
import serverConfig from '@src/server.config';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import { DatabaseManagementUc } from './uc/database-management.uc';

const baseImports = [
	FileSystemModule,
	DatabaseManagementModule,
	ConfigModule.forRoot({
		isGlobal: true,
		validationOptions: { infer: true },
		load: [serverConfig],
	}),
];

const imports = (Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean)
	? [...baseImports, KeycloakControllerModule]
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

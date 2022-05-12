import { Dictionary, IPrimaryKey } from '@mikro-orm/core';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { DynamicModule, Module, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ALL_ENTITIES } from '@shared/domain';
import { ConsoleWriterService } from '@shared/infra/console';
import { DatabaseManagementModule, DatabaseManagementService, MongoMemoryDatabaseModule } from '@shared/infra/database';
import { MongoDatabaseModuleOptions } from '@shared/infra/database/mongo-memory-database/types';
import { FileSystemModule } from '@shared/infra/file-system';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@src/config';
import serverConfig from '@src/server.config';
import { DatabaseManagementConsole } from './console/database-management.console';
import { DatabaseManagementController } from './controller/database-management.controller';
import { BsonConverter } from './converter/bson.converter';
import { DatabaseManagementUc } from './uc/database-management.uc';

const imports = [
	FileSystemModule,
	KeycloakModule,
	DatabaseManagementModule,
	ConfigModule.forRoot({
		isGlobal: true,
		validationOptions: { infer: true },
		load: [serverConfig],
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
];

const controllers = [DatabaseManagementController];

export const defaultMikroOrmOptions: MikroOrmModuleSyncOptions = {
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
	},
};

@Module({
	imports: [
		...imports,
		MikroOrmModule.forRoot({
			...defaultMikroOrmOptions,
			// TODO repeats server module definitions
			type: 'mongo',
			clientUrl: DB_URL,
			password: DB_PASSWORD,
			user: DB_USERNAME,
			entities: ALL_ENTITIES,
			allowGlobalContext: true,
			findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return new NotFoundException(`The requested ${entityName}: ${where} has not been found.`);
			},
		}),
	],
	providers,
	controllers,
})
export class ManagementModule {}

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions })],
	providers,
	controllers,
})
export class ManagementTestModule {
	static forRoot(options?: MongoDatabaseModuleOptions): DynamicModule {
		return {
			module: ManagementModule,
			imports: [MongoMemoryDatabaseModule.forRoot({ ...defaultMikroOrmOptions, ...options })],
		};
	}
}

import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { ConsoleWriterModule } from '@infra/console/console-writer/console-writer.module';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { SyncModule } from '@infra/sync/sync.module';
import { MikroOrmModule, MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { FilesModule } from '@modules/files';
import { ManagementModule } from '@modules/management/management.module';
import { serverConfig } from '@modules/server';
import { Module } from '@nestjs/common'; // TODO: Import Reihenfolge sieht falsch aus ...IDM prüfen.
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import path from 'path';
import { ENTITIES } from './migrations.entity.imports';
import { ServerConsole } from './server.console';

const migrationsPath = path.resolve(__dirname, '..', 'migrations', 'mikro-orm'); // TODO: Warum ist das hier überhaupt relevant?

const mikroOrmCliConfig: MikroOrmModuleSyncOptions = {
	// TODO repeats server module definitions
	type: 'mongo',
	clientUrl: DB_URL,
	password: DB_PASSWORD,
	user: DB_USERNAME,
	entities: ENTITIES,
	allowGlobalContext: true,
	migrations: {
		tableName: 'migrations', // name of database table with log of executed transactions
		path: migrationsPath, // path to the folder with migrations
		pathTs: migrationsPath, // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
		glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
		transactional: false, // wrap each migration in a transaction
		disableForeignKeys: true, // wrap statements with `set foreign_key_checks = 0` or equivalent
		allOrNothing: false, // wrap all migrations in master transaction
		dropTables: false, // allow to disable table dropping
		safe: false, // allow to disable table and column dropping
		snapshot: true, // save snapshot when creating new migrations
		emit: 'ts', // migration generation mode
		// generator: TSMigrationGenerator, // migration generator, e.g. to allow custom formatting
	},
};

@Module({
	imports: [
		ManagementModule,
		ConsoleModule,
		ConsoleWriterModule,
		FilesModule, // TODO: Warum brauchen wir das hier?
		ConfigModule.forRoot(createConfigModuleOptions(serverConfig)),
		...((Configuration.get('FEATURE_IDENTITY_MANAGEMENT_ENABLED') as boolean) ? [KeycloakModule] : []), // TODO: Was macht das KeycloakModule hier?
		MikroOrmModule.forRoot(mikroOrmCliConfig),
		SyncModule, // TODO: Warum brauchen wir das hier?
	],
	providers: [
		/** add console services as providers */
		ServerConsole,
	],
})
export class ServerConsoleModule {}

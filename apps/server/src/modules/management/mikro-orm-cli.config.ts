import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import path from 'path';
import { ENTITIES } from './management.entity.imports';

export const migrationsPath = path.resolve(__dirname, '..', '..', 'migrations', 'mikro-orm');

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

export default mikroOrmCliConfig;

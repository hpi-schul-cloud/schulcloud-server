import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import path from 'path';
import { ENTITIES } from './management.entity.imports';

const migrationsDistPath = path.resolve(__dirname, '..', '..', 'migrations', 'mikro-orm');
const migrationsSourcePath = path.resolve(
	__dirname,
	'..',
	'..',
	'..',
	'..',
	'..',
	'apps',
	'server',
	'src',
	'migrations',
	'mikro-orm'
);

const mikroOrmCliConfig: MikroOrmModuleSyncOptions = {
	type: 'mongo',
	clientUrl: DB_URL,
	password: DB_PASSWORD,
	user: DB_USERNAME,
	entities: ENTITIES,
	allowGlobalContext: true,
	migrations: {
		tableName: 'migrations', // name of database table with log of executed transactions
		path: migrationsDistPath, // path to the folder with migrations
		pathTs: migrationsSourcePath, // path to the folder with TS migrations
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

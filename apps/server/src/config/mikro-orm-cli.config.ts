// TODO: Rename file it is only used for migrations
import { DB_PASSWORD, DB_URL, DB_USERNAME } from '@imports-from-feathers';
import type { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import path from 'path';
import { ENTITIES } from './mikro-orm-cli.entity.imports';

const migrationsPath = path.resolve(__dirname, '..', 'migrations', 'mikro-orm');

export const mikroOrmCliConfig: MikroOrmModuleSyncOptions = {
	// TODO repeats server module definitions
	type: 'mongo',
	clientUrl: DB_URL,
	password: DB_PASSWORD,
	user: DB_USERNAME,
	entities: ENTITIES,
	// TODO: use regex instead https://github.com/mikro-orm/nestjs-realworld-example-app/blob/master/src/mikro-orm.config.ts.example
	// metadataProvider: TsMorphMetadataProvider,
	// entities: ['dist/apps/server/modules/**/*.entity.js', 'dist/apps/server/shared/domain/entity/*.entity.js'],
	// entitiesTs: ['apps/server/src/modules/**/*.entity.ts', 'apps/server/src/shared/domain/entity/*.entity.ts'],
	// extensions: [Migrator, EntityGenerator],
	allowGlobalContext: true,
	/*
	findOneOrFailHandler: (entityName: string, where: Dictionary | IPrimaryKey) =>
		new NotFoundException(`The requested ${entityName}: ${JSON.stringify(where)} has not been found.`),
	*/
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

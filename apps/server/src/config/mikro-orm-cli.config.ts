import type { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { ALL_ENTITIES } from '@shared/domain/entity';
import { FileEntity } from '@modules/files/entity';
import { FileRecord } from '@modules/files-storage/entity';
import path from 'path';
import { MongoDriver } from '@mikro-orm/mongodb';
import { DB_PASSWORD, DB_URL, DB_USERNAME } from './index';

const migrationsPath = path.resolve(__dirname, '..', 'migrations', 'mikro-orm');

export const mikroOrmCliConfig: MikroOrmModuleSyncOptions = {
	// TODO repeats server module definitions
	driver: MongoDriver,
	clientUrl: DB_URL,
	password: DB_PASSWORD,
	user: DB_USERNAME,
	entities: [...ALL_ENTITIES, FileEntity, FileRecord],
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

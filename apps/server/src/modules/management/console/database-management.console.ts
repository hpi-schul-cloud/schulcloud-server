import { ConsoleWriterService } from '@infra/console/console-writer/console-writer.service';
import { Command, Console } from 'nestjs-console';
import { DatabaseManagementUc } from '../uc/database-management.uc';

interface Options {
	collection?: string;
	override?: boolean;
	onlyfactories?: boolean;
}

interface MigrationOptions {
	up?: boolean;
	down?: boolean;
	from?: string;
	to?: string;
	only?: string;
	pending?: boolean;
}

@Console({ command: 'database', description: 'database setup console' })
export class DatabaseManagementConsole {
	constructor(private consoleWriter: ConsoleWriterService, private databaseManagementUc: DatabaseManagementUc) {}

	@Command({
		command: 'seed',
		options: [
			{
				flags: '-c, --collection <collection>',
				required: false,
				description: 'filter for a single <collection>',
			},
			{
				flags: '-o, --onlyfactories',
				required: false,
				description: 'seed from factories only',
			},
		],
		description: 'reset database collections with seed data from filesystem',
	})
	async seedCollections(options: Options): Promise<string[]> {
		const filter = options?.collection ? [options.collection] : undefined;

		const collections = options.onlyfactories
			? await this.databaseManagementUc.seedDatabaseCollectionsFromFactories(filter)
			: await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem(filter);
		const report = JSON.stringify(collections);
		this.consoleWriter.info(report);
		return collections;
	}

	@Command({
		command: 'export',
		options: [
			{
				flags: '-c, --collection <collection>',
				required: false,
				description: 'filter for a single <collection>',
			},
			{
				flags: '-o, --override',
				required: false,
				description: 'optional export collections to setup folder and override existing files',
			},
		],
		description: 'export database collections to filesystem',
	})
	async exportCollections(options: Options): Promise<string[]> {
		const filter = options?.collection ? [options.collection] : undefined;
		const toSeedFolder = options?.override ? true : undefined;
		const collections = await this.databaseManagementUc.exportCollectionsToFileSystem(filter, toSeedFolder);
		const report = JSON.stringify(collections);
		this.consoleWriter.info(report);
		return collections;
	}

	@Command({
		command: 'sync-indexes',
		options: [],
		description: 'sync indexes from nest and mikroorm',
	})
	async syncIndexes(): Promise<string> {
		await this.databaseManagementUc.syncIndexes();
		const report = 'sync of indexes is completed';
		this.consoleWriter.info(report);
		return report;
	}

	@Command({
		command: 'migration',
		options: [
			{
				flags: '--up',
				required: false,
				description: 'execute migration up',
			},
			{
				flags: '--down',
				required: false,
				description: 'rollback migration (down)',
			},
			{
				flags: '-f, --from',
				required: false,
				description: 'run migration up/down from specified name',
			},
			{
				flags: '-t, --to',
				required: false,
				description: 'run migration up/down to specified name',
			},
			{
				flags: '-o, --only',
				required: false,
				description: 'run a single migration',
			},
			{
				flags: '--pending',
				required: false,
				description: 'list pending migrations',
			},
		],
		description: 'Execute MikroOrm migration up/down',
	})
	async migration(migrationOptions: MigrationOptions): Promise<string> {
		let report = 'no migration option was given';
		if (!migrationOptions.up && !migrationOptions.down && !migrationOptions.pending) {
			this.consoleWriter.error(report);
			return report;
		}
		if (migrationOptions.up) {
			await this.databaseManagementUc.migrationUp(migrationOptions.from, migrationOptions.to, migrationOptions.only);
			report = 'migration up is completed';
		}
		if (migrationOptions.down) {
			await this.databaseManagementUc.migrationDown(migrationOptions.from, migrationOptions.to, migrationOptions.only);
			report = 'migration down is completed';
		}
		if (migrationOptions.pending) {
			const pendingMigrations = await this.databaseManagementUc.migrationPending();
			report = `Pending: ${JSON.stringify(pendingMigrations.map((migration) => migration.name))}`;
		}

		this.consoleWriter.info(report);
		return report;
	}
}

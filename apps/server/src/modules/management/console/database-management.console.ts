import { Command, Console } from 'nestjs-console';
import { ConsoleWriterService } from '@shared/infra/console/console-writer/console-writer.service';
import { DatabaseManagementUc } from '../uc/database-management.uc';

interface Options {
	collection?: string;
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
		],
		description: 'reset database collections with seed data from filesystem',
	})
	async seedCollections(options: Options): Promise<string[]> {
		const filter = options?.collection ? [options.collection] : undefined;
		const collections = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem(filter);
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
		],
		description: 'export database collections to filesystem',
	})
	async exportCollections(options: Options): Promise<string[]> {
		const filter = options?.collection ? [options.collection] : undefined;
		const collections = await this.databaseManagementUc.exportCollectionsToFileSystem(filter);
		const report = JSON.stringify(collections);
		this.consoleWriter.info(report);
		return collections;
	}
}

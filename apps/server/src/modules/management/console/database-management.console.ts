import { Command, Console } from 'nestjs-console';
import { DatabaseManagementUc } from '../uc/database-management.uc';
import { ConsoleWriterService } from '../../../shared/infra/console/console-writer/console-writer.service';

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
	async seedCollections(options: Options): Promise<void> {
		const filter = options?.collection ? [options.collection] : undefined;
		const collections = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem(filter);
		this.consoleWriter.info(JSON.stringify(collections));
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
	async exportCollections(options: Options): Promise<void> {
		const filter = options?.collection ? [options.collection] : undefined;
		const collections = await this.databaseManagementUc.exportCollectionsToFileSystem(filter);
		this.consoleWriter.info(JSON.stringify(collections));
	}
}

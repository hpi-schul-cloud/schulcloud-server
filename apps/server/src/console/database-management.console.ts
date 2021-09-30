/* eslint-disable no-console */
import { Command, Console } from 'nestjs-console';
import { DatabaseManagementUc } from '../shared/infra/database-management/database-management.uc';
import { ConsoleWriter } from './console-writer/console-writer.service';

interface Options {
	collection?: string;
}
@Console({ command: 'database', description: 'database setup console' })
export class DatabaseManagementConsole {
	constructor(private consoleWriter: ConsoleWriter, private managementService: DatabaseManagementUc) {}

	@Command({
		command: 'seed <collection>',
		options: [
			{
				flags: '-c, --collection <collection>',
				required: false,
				description: 'filter for a single <collection>',
			},
		],
		description: 'reset database collections with seed data from filesystem',
	})
	async seedCollections(collection?: string): Promise<void> {
		if (collection != null) {
			this.consoleWriter.info(`seed collection ${collection} from filesystem...`);
			await this.managementService.seedDatabaseCollectionsFromFileSystem([collection]);
			this.consoleWriter.info(`done.`);
		} else {
			this.consoleWriter.info(`seed all collections from filesystem...`);
			await this.managementService.seedDatabaseCollectionsFromFileSystem();
			this.consoleWriter.info(`done.`);
		}
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
		if (options.collection != null) {
			this.consoleWriter.info(`export collection ${options.collection} from filesystem...`);
			const collections = await this.managementService.exportCollectionsToFileSystem([options.collection]);
			this.consoleWriter.info(`done for collections ${collections.join(',')}}`);
		} else {
			this.consoleWriter.info(`export all collections from filesystem...`);
			const collections = await this.managementService.exportCollectionsToFileSystem();
			this.consoleWriter.info(`done for collections ${collections.join(',')}}`);
		}
	}
}

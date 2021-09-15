/* eslint-disable no-console */
import { Command, Console } from 'nestjs-console';
import { IDatabaseManagementController } from '../modules/database/database-management/database-management.interface';
import { DatabaseManagementService } from '../modules/database/database-management/database-management.service';
import { ConsoleWriter } from './console-writer/console-writer.service';

@Console({ command: 'database', description: 'database setup console' })
export class DatabaseManagementConsole implements IDatabaseManagementController {
	constructor(private consoleWriter: ConsoleWriter, private managementService: DatabaseManagementService) {}

	@Command({
		command: 'seed',
		description: 'reset database collections with seed data from filesystem',
	})
	async importCollections(): Promise<void> {
		this.consoleWriter.info(`import all collections from filesystem...`);
		await this.managementService.import();
		this.consoleWriter.info(`done.`);
	}

	@Command({
		command: 'seed-collection <collection>',
		description: 'reset database collection <collection> with seed data from filesystem',
	})
	async importCollection(collection: string): Promise<void> {
		this.consoleWriter.info(`import collection ${collection} from filesystem...`);
		await this.managementService.import([collection]);
		this.consoleWriter.info(`done.`);
	}

	@Command({
		command: 'export',
		description: 'export database collections to filesystem',
	})
	async exportCollections(): Promise<void> {
		await this.managementService.export();
	}

	@Command({
		command: 'export-collection <collectionName>',
		description: 'export database collection <collectionName> to filesystem',
	})
	async exportCollection(collectionName: string): Promise<void> {
		await this.managementService.export([collectionName]);
	}
}

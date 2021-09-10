import { Controller, Param, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { ManagementService } from './database-management.service';

@Controller('management')
export class DatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: ManagementService) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not use Mongo Management Controller via REST in production!');
	}

	@Post('seed-database')
	async importCollections(): Promise<void> {
		await this.managementService.seedAllCollectionsFromFiles();
	}

	@Post('seed-database/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.seedCollectionFromFile(collectionName);
	}

	@Post('export-database')
	async exportCollections(): Promise<void> {
		await this.managementService.exportAllCollectionsToFiles();
	}

	@Post('export-database/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.exportCollectionToFile(collectionName);
	}
}

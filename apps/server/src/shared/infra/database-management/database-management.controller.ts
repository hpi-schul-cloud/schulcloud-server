import { Controller, Param, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { DatabaseManagementUc } from './database-management.uc';

@Controller('management/database')
export class DatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: DatabaseManagementUc) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not use Mongo Management Controller via REST in production!');
	}

	@Post('seed')
	async importCollections(): Promise<void> {
		await this.managementService.seedDatabaseCollectionsFromFileSystem();
	}

	@Post('seed/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.seedDatabaseCollectionsFromFileSystem([collectionName]);
	}

	@Post('export')
	async exportCollections(): Promise<void> {
		await this.managementService.exportCollectionsToFileSystem();
	}

	@Post('export/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.exportCollectionsToFileSystem([collectionName]);
	}
}

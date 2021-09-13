import { Controller, Param, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { DatabaseManagementService } from './database-management.service';

@Controller('management')
export class DatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: DatabaseManagementService) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not use Mongo Management Controller via REST in production!');
	}

	@Post('seed-database')
	async importCollections(): Promise<void> {
		await this.managementService.import();
	}

	@Post('seed-database/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.import([collectionName]);
	}

	@Post('export-database')
	async exportCollections(): Promise<void> {
		await this.managementService.export();
	}

	@Post('export-database/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.export([collectionName]);
	}
}

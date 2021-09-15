import { Controller, Param, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { DatabaseManagementService } from './database-management.service';

@Controller('management/database')
export class DatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: DatabaseManagementService) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not use Mongo Management Controller via REST in production!');
	}

	@Post('seed')
	async importCollections(): Promise<void> {
		await this.managementService.seed();
	}

	@Post('seed/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.seed([collectionName]);
	}

	@Post('export')
	async exportCollections(): Promise<void> {
		await this.managementService.export();
	}

	@Post('export/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.export([collectionName]);
	}
}

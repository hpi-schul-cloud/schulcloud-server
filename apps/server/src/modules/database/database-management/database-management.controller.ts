import { Controller, Param, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { IDatabaseManagementController } from './database-management.interface';
import { DatabaseManagementService } from './database-management.service';

@Controller('management/database')
export class DatabaseManagementController implements IDatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: DatabaseManagementService) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not use Mongo Management Controller via REST in production!');
	}

	@Post('seed')
	async importCollections(): Promise<void> {
		await this.managementService.import();
	}

	@Post('seed/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<void> {
		await this.managementService.import([collectionName]);
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

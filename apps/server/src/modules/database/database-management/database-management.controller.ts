import { Controller, Post } from '@nestjs/common';
import { Logger } from '../../../core/logger/logger.service';
import { ManagementService } from './database-management.service';

@Controller('mongo-console')
export class DatabaseManagementController {
	private logger: Logger;

	constructor(private managementService: ManagementService) {
		this.logger = new Logger(DatabaseManagementController.name, true);
		this.logger.error('Do not publish Mongo Console Controller via REST in production!');
	}

	@Post('reset')
	async resetCollections(): Promise<string[]> {
		const collectionNamesDropped = this.managementService.resetAllCollections();
		return collectionNamesDropped;
	}
}

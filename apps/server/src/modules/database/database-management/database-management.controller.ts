import { Controller, Post } from '@nestjs/common';
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
	async resetCollections(): Promise<void> {
		await this.managementService.resetAllCollections();
	}

	@Post('export-database')
	async exportCollections(): Promise<void> {
		await this.managementService.exportAllCollections();
	}
}

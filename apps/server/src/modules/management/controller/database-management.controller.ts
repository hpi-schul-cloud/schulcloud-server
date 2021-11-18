import { Controller, Param, Post } from '@nestjs/common';
import { DatabaseManagementUc } from '../uc/database-management.uc';

@Controller('management/database')
export class DatabaseManagementController {
	constructor(private databaseManagementUc: DatabaseManagementUc) {}

	@Post('seed')
	async importCollections(): Promise<string[]> {
		const result = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem();
		return result;
	}

	@Post('seed/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		const result = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem([collectionName]);
		return result;
	}

	@Post('export')
	async exportCollections(): Promise<string[]> {
		const result = await this.databaseManagementUc.exportCollectionsToFileSystem();
		return result;
	}

	@Post('export/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		const result = await this.databaseManagementUc.exportCollectionsToFileSystem([collectionName]);
		return result;
	}
}

import { Controller, Param, Post, All, Query } from '@nestjs/common';
import { DatabaseManagementUc } from '../uc/database-management.uc';

@Controller('management/database')
export class DatabaseManagementController {
	constructor(private databaseManagementUc: DatabaseManagementUc) {}

	@All('seed')
	async importCollections(@Query('with-indexes') withIndexes: boolean): Promise<string[]> {
		const res = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem();
		if (withIndexes) {
			await this.databaseManagementUc.syncIndexes();
		}
		return res;
	}

	@Post('seed/:collectionName')
	async importCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		return this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem([collectionName]);
	}

	@Post('export')
	async exportCollections(): Promise<string[]> {
		return this.databaseManagementUc.exportCollectionsToFileSystem();
	}

	@Post('export/:collectionName')
	async exportCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		return this.databaseManagementUc.exportCollectionsToFileSystem([collectionName]);
	}

	@Post('sync-indexes')
	syncIndexes() {
		return this.databaseManagementUc.syncIndexes();
	}
}

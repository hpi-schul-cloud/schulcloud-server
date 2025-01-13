import { FeathersServiceProvider } from '@infra/feathers';
import { All, Body, Controller, Header, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiConsumes } from '@nestjs/swagger';
import { DatabaseManagementUc } from '../uc/database-management.uc';

@Controller('management/database')
export class DatabaseManagementController {
	constructor(
		private databaseManagementUc: DatabaseManagementUc,
		private feathersServiceProvider: FeathersServiceProvider
	) {}

	@All('seed')
	public async importCollections(@Query('with-indexes') withIndexes: boolean): Promise<string[]> {
		const res = await this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem();
		if (withIndexes) {
			await this.databaseManagementUc.syncIndexes();
		}
		return res;
	}

	@Post('seed/:collectionName')
	public importCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		return this.databaseManagementUc.seedDatabaseCollectionsFromFileSystem([collectionName]);
	}

	@Post('export')
	public exportCollections(): Promise<string[]> {
		return this.databaseManagementUc.exportCollectionsToFileSystem();
	}

	@Post('export/:collectionName')
	public exportCollection(@Param('collectionName') collectionName: string): Promise<string[]> {
		return this.databaseManagementUc.exportCollectionsToFileSystem([collectionName]);
	}

	@Post('sync-indexes')
	public async syncIndexes(): Promise<void> {
		// it is absolutely crucial to call the legacy stuff first, otherwise it will drop newly created indexes!
		await this.feathersServiceProvider.getService('sync-legacy-indexes').create();
		return this.databaseManagementUc.syncIndexes();
	}

	@Post('encrypt-plain-text')
	@Header('content-type', 'text/plain')
	@ApiConsumes('text/plain', 'application/text')
	@HttpCode(200)
	public encryptPlainText(@Body() plainText: string): string {
		return this.databaseManagementUc.encryptPlainText(plainText);
	}
}

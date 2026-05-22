import { DatabaseModule } from '@infra/database';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { findOneOrFailHandler } from '@shared/common/database-error.handler';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { MediaSyncConsoleAppModule, MediaSyncConsoleAppTestModule } from './media-sync-console.app.module';
import { TEST_ENTITIES } from './media-sync-console.entity.imports';

@Module({
	imports: [MongoMemoryDatabaseModule.forRoot({ ...findOneOrFailHandler, entities: TEST_ENTITIES })],
})
class DatabaseModuleOverride {}

// TODO remove this when definitive integration tests for this console app are implemented
// this is for code coverage and possibly to detect missing deps for media sync
describe(MediaSyncConsoleAppModule.name, () => {
	describe('when the module is loaded', () => {
		it('should have a defined module', async () => {
			const module = await Test.createTestingModule({
				imports: [MediaSyncConsoleAppTestModule],
			})
				.overrideModule(DatabaseModule)
				.useModule(DatabaseModuleOverride)
				.compile();

			expect(module).toBeDefined();

			await module.close();
		});
	});
});

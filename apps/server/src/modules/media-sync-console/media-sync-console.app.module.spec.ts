import { Test } from '@nestjs/testing';
import { MediaSyncConsoleAppModule, MediaSyncConsoleAppTestModule } from './media-sync-console.app.module';

// TODO remove this when definitive integration tests for this console app are implemented
// this is for code coverage and possibly to detect missing deps for media sync
describe(MediaSyncConsoleAppModule.name, () => {
	describe('when the module is loaded', () => {
		it('should have a defined module', async () => {
			const module = await Test.createTestingModule({
				imports: [MediaSyncConsoleAppTestModule],
			}).compile();

			expect(module).toBeDefined();

			await module.close();
		});
	});
});

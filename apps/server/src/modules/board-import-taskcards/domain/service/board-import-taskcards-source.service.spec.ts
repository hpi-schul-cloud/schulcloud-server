import { BoardImportSourceRegistryService } from '@modules/board-import';
import { Test, type TestingModule } from '@nestjs/testing';
import { BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN, BoardImportTaskcardsConfig } from '../../board-import-taskcards.config';
import {
	BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
	BOARD_IMPORT_TASKCARDS_SWITCH_KEY,
} from '../../board-import-taskcards.constants';
import { BoardImportTaskcardsSourceService } from './board-import-taskcards-source.service';

describe(BoardImportTaskcardsSourceService.name, () => {
	let module: TestingModule;
	let service: BoardImportTaskcardsSourceService;
	let registry: BoardImportSourceRegistryService;
	let config: BoardImportTaskcardsConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				BoardImportTaskcardsSourceService,
				BoardImportSourceRegistryService,
				{ provide: BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN, useValue: new BoardImportTaskcardsConfig() },
			],
		}).compile();

		service = module.get(BoardImportTaskcardsSourceService);
		registry = module.get(BoardImportSourceRegistryService);
		config = module.get(BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when the service is created', () => {
		it('should register itself as the source TaskCards', () => {
			const result = registry.findByType(BOARD_IMPORT_TASKCARDS_SOURCE_TYPE);

			expect(result).toBe(service);
		});

		it('should have the switch key of TaskCards', () => {
			expect(service.switchKey).toEqual(BOARD_IMPORT_TASKCARDS_SWITCH_KEY);
		});

		it('should have the board hosts of the config', () => {
			expect(service.boardHosts).toEqual(config.boardHosts);
		});
	});
});

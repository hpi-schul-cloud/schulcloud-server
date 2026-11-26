import { type BoardImportSourceDefinition, BoardImportSourceRegistryService } from '@modules/board-import';
import { Inject, Injectable } from '@nestjs/common';
import { BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN, BoardImportTaskcardsConfig } from '../../board-import-taskcards.config';
import {
	BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
	BOARD_IMPORT_TASKCARDS_SWITCH_KEY,
} from '../../board-import-taskcards.constants';

@Injectable()
export class BoardImportTaskcardsSourceService implements BoardImportSourceDefinition {
	public readonly type = BOARD_IMPORT_TASKCARDS_SOURCE_TYPE;

	public readonly switchKey = BOARD_IMPORT_TASKCARDS_SWITCH_KEY;

	public readonly boardHosts: string[];

	constructor(
		@Inject(BOARD_IMPORT_TASKCARDS_CONFIG_TOKEN) config: BoardImportTaskcardsConfig,
		boardImportSourceRegistryService: BoardImportSourceRegistryService
	) {
		this.boardHosts = config.boardHosts;
		boardImportSourceRegistryService.registerSource(this);
	}
}

import { BoardImportSourceType } from './board-import-source';

// Each key must be in the runtime config defaults of the server, which is the list that the superhero dashboard shows.
export const BOARD_IMPORT_SOURCE_SWITCH_KEYS: Record<BoardImportSourceType, string> = {
	[BoardImportSourceType.TASKCARDS]: 'BOARD_IMPORT_TASKCARDS_ENABLED',
};

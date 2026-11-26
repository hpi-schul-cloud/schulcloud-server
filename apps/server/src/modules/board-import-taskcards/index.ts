/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export {
	BOARD_IMPORT_TASKCARDS_SOURCE_TYPE,
	BOARD_IMPORT_TASKCARDS_SWITCH_KEY,
} from './board-import-taskcards.constants';
export { BoardImportTaskcardsModule } from './board-import-taskcards.module';

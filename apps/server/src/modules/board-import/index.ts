/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { BOARD_IMPORT_PUBLIC_API_CONFIG_TOKEN, BoardImportPublicApiConfig } from './board-import.config';
export { BoardImportModule } from './board-import.module';

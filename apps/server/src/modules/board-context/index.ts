/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { BoardContextModule as BoardContextApiHelperModule } from './board-context-api-helper.module';
export { BoardContextApiHelperService } from './board-context-api-helper.service';
export { BOARD_CONTEXT_PUBLIC_API_CONFIG, BoardContextPublicApiConfig } from './board-context.config';

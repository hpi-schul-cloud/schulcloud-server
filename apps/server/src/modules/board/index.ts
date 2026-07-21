/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { BOARD_PUBLIC_API_CONFIG_TOKEN, BoardPublicApiConfig } from './board.config';
export { BoardModule } from './board.module';
export {
	AnyBoardNode,
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardLayout,
	BoardNodeAuthorizable,
	BoardNodeType,
	// @modules/authorization/domain/rules/board-node.rule.ts
	BoardRoles,
	Card,
	Column,
	ColumnBoard,
	isColumnBoard,
	// @modules/tool/tool-launch/service/auto-parameter-strategy/auto-context-name.strategy.ts
	MediaBoard,
} from './domain';

export { BoardCommonToolService, BoardNodeAuthorizableService, BoardNodeService, ColumnBoardService } from './service';

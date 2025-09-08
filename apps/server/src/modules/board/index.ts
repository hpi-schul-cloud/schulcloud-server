export { BoardConfig } from './board.config';
export { MediaBoardConfig } from './media-board.config';
export { BoardModule } from './board.module';
export { AnyElementContentBody, LinkContentBody, RichTextContentBody } from './controller/dto';
export {
	AnyBoardNode,
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardLayout,
	BoardNode,
	BoardNodeAuthorizable,
	BoardNodeFactory,
	BoardNodeType,
	// @modules/authorization/domain/rules/board-node.rule.ts
	BoardRoles,
	Card,
	Column,
	ColumnBoard,
	ContentElementType,
	// @modules/tool/tool-launch/service/auto-parameter-strategy/auto-context-name.strategy.ts
	MediaBoard,
	MediaBoardColors,
	SubmissionItem,
	UserWithBoardRoles,
	isCard,
	isColumn,
	isColumnBoard,
	isDrawingElement,
	isLinkElement,
	isRichTextElement,
	isSubmissionItem,
	isSubmissionItemContent,
} from './domain';

export {
	BoardCommonToolService,
	BoardNodeAuthorizableService,
	BoardNodeService,
	ColumnBoardService,
	MediaAvailableLineService,
	MediaBoardService,
} from './service';

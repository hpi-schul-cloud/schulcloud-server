import type { Card } from '../card.do';
import type { ColumnBoard } from '../colum-board.do';
import type { Column } from '../column.do';

export enum BoardNodeType {
	COLUMN_BOARD = 'column-board',
	COLUMN = 'column',
	CARD = 'card',
	// FILE_ELEMENT = 'file-element',
	// LINK_ELEMENT = 'link-element',
	// RICH_TEXT_ELEMENT = 'rich-text-element',
	// DRAWING_ELEMENT = 'drawing-element',
	// SUBMISSION_CONTAINER_ELEMENT = 'submission-container-element',
	// SUBMISSION_ITEM = 'submission-item',
	// EXTERNAL_TOOL = 'external-tool',

	// MEDIA_BOARD = 'media-board',
	// MEDIA_LINE = 'media-line',
	// MEDIA_EXTERNAL_TOOL_ELEMENT = 'media-external-tool-element',
}

export type AnyBoardNode = ColumnBoard | Card | Column;

export type AnyBoardNodeType = `${BoardNodeType}`;
export type BoardNodeTypeToClass<T extends AnyBoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
	? ColumnBoard
	: T extends BoardNodeType.COLUMN
	? Column
	: T extends BoardNodeType.CARD
	? Card
	: never;

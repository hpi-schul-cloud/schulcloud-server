import type { Card } from '../card.do';
import type { ColumnBoard } from '../colum-board.do';
import type { Column } from '../column.do';
import type { RichTextElement } from '../rich-text-element.do';
import { BoardNodeType } from './board-node-type.enum';

export type BoardNodeTypeToClass<T extends BoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
	? ColumnBoard
	: T extends BoardNodeType.COLUMN
	? Column
	: T extends BoardNodeType.CARD
	? Card
	: T extends BoardNodeType.RICH_TEXT_ELEMENT
	? RichTextElement
	: never;

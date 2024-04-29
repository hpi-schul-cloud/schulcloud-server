import { Card } from './card.do';
import { ColumnBoard } from './colum-board.do';
import { Column } from './column.do';
import { RichTextElement } from './rich-text-element.do';
import type { AnyBoardNode } from './types/any-board-node';
import { BoardNodeType } from './types/board-node-type.enum';

// export type BoardNodeTypeToClass<T extends BoardNodeType> = T extends BoardNodeType.COLUMN_BOARD
// 	? ColumnBoard
// 	: T extends BoardNodeType.COLUMN
// 	? Column
// 	: T extends BoardNodeType.CARD
// 	? Card
// 	: T extends BoardNodeType.RICH_TEXT_ELEMENT
// 	? RichTextElement
// 	: never;

// register node types
const BoardNodeTypeToConstructor = {
	[BoardNodeType.COLUMN_BOARD]: ColumnBoard,
	[BoardNodeType.COLUMN]: Column,
	[BoardNodeType.CARD]: Card,
	[BoardNodeType.RICH_TEXT_ELEMENT]: RichTextElement,
} as const;

export const getBoardNodeConstructor = <T extends BoardNodeType>(type: T): typeof BoardNodeTypeToConstructor[T] =>
	BoardNodeTypeToConstructor[type];

export const getBoardNodeType = <T extends AnyBoardNode>(boardNode: T): BoardNodeType => {
	const type = Object.keys(BoardNodeTypeToConstructor).find((key) => {
		const Constructor = BoardNodeTypeToConstructor[key as BoardNodeType];
		return boardNode instanceof Constructor;
	});
	if (type === undefined) {
		throw new Error();
	}
	return type as BoardNodeType;
};

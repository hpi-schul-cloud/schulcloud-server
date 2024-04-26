import { AnyBoardNode, BoardNodeType, Card, Column, ColumnBoard, RichTextElement } from '../../domain';

export const getBoardNodeType = (boardNode: AnyBoardNode): BoardNodeType => {
	let type: BoardNodeType;

	if (boardNode instanceof ColumnBoard) {
		type = BoardNodeType.COLUMN_BOARD;
	} else if (boardNode instanceof Column) {
		type = BoardNodeType.COLUMN;
	} else if (boardNode instanceof Card) {
		type = BoardNodeType.CARD;
	} else if (boardNode instanceof RichTextElement) {
		type = BoardNodeType.RICH_TEXT_ELEMENT;
	} else {
		throw new Error(`Unable to get board node type of class '${(boardNode as object).constructor.name}'`);
	}

	return type;
};

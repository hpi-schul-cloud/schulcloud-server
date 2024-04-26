import {
	AnyBoardNode,
	BoardNodeType,
	Card,
	CardProps,
	Column,
	ColumnBoard,
	ColumnBoardProps,
	ColumnProps,
	RichTextElement,
	RichTextElementProps,
} from '../../domain';
import { BoardNodeEntity } from '../entity';

export const buildBoardNodeFromEntity = (entity: BoardNodeEntity): AnyBoardNode => {
	let boardNode: AnyBoardNode;

	switch (entity.type) {
		case BoardNodeType.COLUMN_BOARD:
			boardNode = new ColumnBoard(entity as ColumnBoardProps);
			break;
		case BoardNodeType.COLUMN:
			boardNode = new Column(entity as ColumnProps);
			break;
		case BoardNodeType.CARD:
			boardNode = new Card(entity as CardProps);
			break;
		case BoardNodeType.RICH_TEXT_ELEMENT:
			boardNode = new RichTextElement(entity as RichTextElementProps);
			break;
		default:
			throw new Error(`Cannot create board node from type '${entity.type as string}'`);
	}

	return boardNode;
};

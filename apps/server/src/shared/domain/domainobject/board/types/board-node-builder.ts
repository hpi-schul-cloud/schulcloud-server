import type { BoardNode } from '../../../entity';
import { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import { Column } from '../column.do';
import { TextElement } from '../text-element.do';

export interface BoardNodeBuilder {
	buildColumnBoardNode(columnBoard: ColumnBoard): BoardNode;
	buildColumnNode(column: Column, parent: BoardNode): BoardNode;
	buildCardNode(card: Card, parent: BoardNode): BoardNode;
	buildTextElementNode(textElement: TextElement, parent: BoardNode): BoardNode;
}

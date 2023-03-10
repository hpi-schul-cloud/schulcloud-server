import type { EntityId } from '../../../types';
import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { TextElement } from '../text-element.do';

export interface BoardNodeBuilder {
	buildColumnBoardNode(columnBoard: ColumnBoard, parentId?: EntityId): void;
	buildColumnNode(column: Column, parentId?: EntityId): void;
	buildCardNode(card: Card, parentId?: EntityId): void;
	buildTextElementNode(textElement: TextElement, parentId?: EntityId): void;
}

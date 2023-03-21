import type { EntityId } from '../../../types';
import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { TextElement } from '../text-element.do';

export interface BoardNodeBuilder {
	buildColumnBoardNode(columnBoard: ColumnBoard): void;
	buildColumnNode(column: Column, parentId?: EntityId, position?: number): void;
	buildCardNode(card: Card, parentId?: EntityId, position?: number): void;
	buildTextElementNode(textElement: TextElement, parentId?: EntityId, position?: number): void;
}

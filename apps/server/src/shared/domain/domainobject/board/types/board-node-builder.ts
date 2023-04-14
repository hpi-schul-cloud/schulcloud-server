import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { FileElement } from '../file-element.do';
import type { TextElement } from '../text-element.do';
import type { AnyBoardDo } from './any-board-do';

export interface BoardNodeBuilder {
	buildColumnBoardNode(columnBoard: ColumnBoard, parent?: AnyBoardDo): void;
	buildColumnNode(column: Column, parent?: AnyBoardDo): void;
	buildCardNode(card: Card, parent?: AnyBoardDo): void;
	buildTextElementNode(textElement: TextElement, parent?: AnyBoardDo): void;
	buildFileElementNode(fileElement: FileElement, parent?: AnyBoardDo): void;
}

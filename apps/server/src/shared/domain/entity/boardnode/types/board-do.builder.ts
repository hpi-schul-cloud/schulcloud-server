import type { Card, Column, ColumnBoard, FileElement, RichTextElement } from '../../../domainobject';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { RichTextElementNode } from '../richtext-element-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	buildFileElement(boardNode: FileElementNode): FileElement;
}

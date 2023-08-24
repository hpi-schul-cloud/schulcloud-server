import { SubmissionItem } from '@shared/domain/domainobject/board/submission-item.do';
import { DrawingElementNode } from '@shared/domain/entity/boardnode/drawing-element-node.entity';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import type {
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../../../domainobject';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { RichTextElementNode } from '../rich-text-element-node.entity';
import type { SubmissionContainerElementNode } from '../submission-container-element-node.entity';
import type { SubmissionItemNode } from '../submission-item-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildFileElement(boardNode: FileElementNode): FileElement;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	buildDrawingElement(boardNode: DrawingElementNode): DrawingElement;
	buildSubmissionContainerElement(boardNode: SubmissionContainerElementNode): SubmissionContainerElement;
	buildSubmissionItem(boardNode: SubmissionItemNode): SubmissionItem;
}

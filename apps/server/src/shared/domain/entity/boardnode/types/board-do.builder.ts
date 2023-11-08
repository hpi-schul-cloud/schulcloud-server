import type {
	Card,
	Column,
	ColumnBoard,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '../../../domainobject';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import { DrawingElementNode } from '../drawing-element-node.entity';
import type { ExternalToolElementNodeEntity } from '../external-tool-element-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { LinkElementNode } from '../link-element-node.entity';
import type { RichTextElementNode } from '../rich-text-element-node.entity';
import type { SubmissionContainerElementNode } from '../submission-container-element-node.entity';
import type { SubmissionItemNode } from '../submission-item-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildDrawingElement(boardNode: DrawingElementNode): DrawingElement;
	buildFileElement(boardNode: FileElementNode): FileElement;
	buildLinkElement(boardNode: LinkElementNode): LinkElement;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	buildSubmissionContainerElement(boardNode: SubmissionContainerElementNode): SubmissionContainerElement;
	buildSubmissionItem(boardNode: SubmissionItemNode): SubmissionItem;
	buildExternalToolElement(boardNode: ExternalToolElementNodeEntity): ExternalToolElement;
}

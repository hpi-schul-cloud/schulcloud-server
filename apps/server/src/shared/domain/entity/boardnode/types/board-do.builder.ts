import { SubmissionContainerElement } from '@shared/domain/domainobject/board/submission-container-element.do';
import type {
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionBoard,
	SubmissionSubElement,
} from '../../../domainobject';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { RichTextElementNode } from '../rich-text-element-node.entity';
import type { SubmissionBoardNode } from '../submission-board-node.entity';
import type { SubmissionContainerElementNode } from '../submission-container-element-node.entity';
import type { SubmissionSubElementNode } from '../submission-subelement-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildFileElement(boardNode: FileElementNode): FileElement;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	// TODO: remove this method, replaced by buildSubmissionBoard
	buildSubmissionSubElement(boardNode: SubmissionSubElementNode): SubmissionSubElement;
	buildSubmissionBoard(boardNode: SubmissionBoardNode): SubmissionBoard;
	buildSubmissionContainerElement(boardNode: SubmissionContainerElementNode): SubmissionContainerElement;
}

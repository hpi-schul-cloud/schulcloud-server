import type {
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionBoard,
	SubmissionSubElement,
	TaskElement,
} from '../../../domainobject';
import type { CardNode } from '../card-node.entity';
import type { ColumnBoardNode } from '../column-board-node.entity';
import type { ColumnNode } from '../column-node.entity';
import type { FileElementNode } from '../file-element-node.entity';
import type { RichTextElementNode } from '../rich-text-element-node.entity';
import type { SubmissionBoardNode } from '../submission-board-node.entity';
import type { SubmissionSubElementNode } from '../submission-subelement-node.entity';
import type { TaskElementNode } from '../task-element-node.entity';

export interface BoardDoBuilder {
	buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard;
	buildColumn(boardNode: ColumnNode): Column;
	buildCard(boardNode: CardNode): Card;
	buildFileElement(boardNode: FileElementNode): FileElement;
	buildRichTextElement(boardNode: RichTextElementNode): RichTextElement;
	buildTaskElement(boardNode: TaskElementNode): TaskElement;
	// TODO: remove this method, replaced by buildSubmissionBoard
	buildSubmissionSubElement(boardNode: SubmissionSubElementNode): SubmissionSubElement;
	buildSubmissionBoard(boardNode: SubmissionBoardNode): SubmissionBoard;
}

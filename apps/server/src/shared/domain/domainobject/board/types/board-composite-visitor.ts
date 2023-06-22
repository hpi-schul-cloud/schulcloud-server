import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionBoard } from '../submission-board.do';
import { SubmissionSubElement } from '../submission-subelment.do';
import { TaskElement } from '../task-element.do';

export interface BoardCompositeVisitor {
	visitColumnBoard(columnBoard: ColumnBoard): void;
	visitColumn(column: Column): void;
	visitCard(card: Card): void;
	visitFileElement(fileElement: FileElement): void;
	visitRichTextElement(richTextElement: RichTextElement): void;
	visitTaskElement(taskElement: TaskElement): void;
	// TODO: remove this method, replaced by visitSubmission
	visitSubmissionSubElement(submissionSubElement: SubmissionSubElement): void;
	visitSubmission(submission: SubmissionBoard): void;
}

export interface BoardCompositeVisitorAsync {
	visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void>;
	visitColumnAsync(column: Column): Promise<void>;
	visitCardAsync(card: Card): Promise<void>;
	visitFileElementAsync(fileElement: FileElement): Promise<void>;
	visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void>;
	visitTaskElementAsync(taskElement: TaskElement): Promise<void>;
	// TODO: remove this method, replaced by visitSubmission
	visitSubmissionSubElementAsync(SubmissionSubElement: SubmissionSubElement): Promise<void>;
	visitSubmissionAsync(submission: SubmissionBoard): Promise<void>;
}

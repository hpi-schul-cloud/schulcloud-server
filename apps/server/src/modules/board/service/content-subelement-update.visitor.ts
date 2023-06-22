import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionBoard,
	SubmissionSubElement,
	TaskElement,
} from '@shared/domain';
import { SubmissionContentBody } from '../controller/dto';

type ContentType = SubmissionContentBody;

// TODO: remove this
export class ContentSubElementUpdateVisitor implements BoardCompositeVisitor {
	private readonly content: ContentType;

	constructor(content: ContentType) {
		this.content = content;
	}

	visitColumnBoard(columnBoard: ColumnBoard): void {
		this.throwNotHandled(columnBoard);
	}

	visitColumn(column: Column): void {
		this.throwNotHandled(column);
	}

	visitCard(card: Card): void {
		this.throwNotHandled(card);
	}

	visitFileElement(fileElement: FileElement): void {
		this.throwNotHandled(fileElement);
	}

	visitRichTextElement(richTextElement: RichTextElement): void {
		this.throwNotHandled(richTextElement);
	}

	visitTaskElement(taskElement: TaskElement): void {
		this.throwNotHandled(taskElement);
	}

	visitSubmission(submission: SubmissionBoard): void {
		this.throwNotHandled(submission);
	}

	visitSubmissionSubElement(submissionSubElement: SubmissionSubElement): void {
		if (this.content instanceof SubmissionContentBody) {
			submissionSubElement.completed = this.content.completed;
			submissionSubElement.userId = this.content.userId;
		} else {
			this.throwNotHandled(submissionSubElement);
		}
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot update element of type: '${component.constructor.name}'`);
	}
}

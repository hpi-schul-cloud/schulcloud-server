import { sanitizeRichText } from '@shared/controller';
import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	FileElement,
	RichTextElement,
	SubmissionBoard,
	SubmissionContainerElement,
	SubmissionSubElement,
} from '@shared/domain';
import { FileContentBody, RichTextContentBody, SubmissionContainerContentBody } from '../controller/dto';

type ContentType = FileContentBody | RichTextContentBody | SubmissionContainerContentBody;

export class ContentElementUpdateVisitor implements BoardCompositeVisitor {
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
		if (this.content instanceof FileContentBody) {
			fileElement.caption = this.content.caption;
		} else {
			this.throwNotHandled(fileElement);
		}
	}

	visitRichTextElement(richTextElement: RichTextElement): void {
		if (this.content instanceof RichTextContentBody) {
			richTextElement.text = sanitizeRichText(this.content.text, this.content.inputFormat);
			richTextElement.inputFormat = this.content.inputFormat;
		} else {
			this.throwNotHandled(richTextElement);
		}
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		if (this.content instanceof SubmissionContainerContentBody) {
			submissionContainerElement.dueDate = this.content.dueDate;
		} else {
			this.throwNotHandled(submissionContainerElement);
		}
	}

	// TODO: remove
	visitSubmissionSubElement(submissionSubElement: SubmissionSubElement): void {
		this.throwNotHandled(submissionSubElement);
	}

	visitSubmission(submission: SubmissionBoard): void {
		this.throwNotHandled(submission);
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot update element of type: '${component.constructor.name}'`);
	}
}

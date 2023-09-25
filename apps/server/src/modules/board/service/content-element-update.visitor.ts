import { sanitizeRichText } from '@shared/controller';
import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	InputFormat,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';
import {
	AnyElementContentBody,
	ExternalToolContentBody,
	FileContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../controller/dto';

export class ContentElementUpdateVisitor implements BoardCompositeVisitor {
	private readonly content: AnyElementContentBody;

	constructor(content: AnyElementContentBody) {
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
			fileElement.caption = sanitizeRichText(this.content.caption, InputFormat.PLAIN_TEXT);
			fileElement.alternativeText = sanitizeRichText(this.content.alternativeText, InputFormat.PLAIN_TEXT);
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

	visitSubmissionItem(submission: SubmissionItem): void {
		this.throwNotHandled(submission);
	}

	visitExternalToolElement(externalToolElement: ExternalToolElement): void {
		if (this.content instanceof ExternalToolContentBody && this.content.contextExternalToolId !== undefined) {
			// Updates should not remove an existing reference to a tool, to prevent orphan tool instances
			externalToolElement.contextExternalToolId = this.content.contextExternalToolId;
		} else {
			this.throwNotHandled(externalToolElement);
		}
	}

	private throwNotHandled(component: AnyBoardDo) {
		throw new Error(`Cannot update element of type: '${component.constructor.name}'`);
	}
}

import { Injectable } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller';
import { InputFormat } from '@shared/domain/types';
import { MetaTagExtractorAdapterService } from '@src/infra/meta-tag-extractor-client';
import {
	AnyElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
} from '../../controller/dto';
import {
	AnyContentElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isLinkElement,
	isRichTextElement,
	isSubmissionContainerElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
} from '../../domain';
import { BoardNodeRepo } from '../../repo';

@Injectable()
export class ContentElementUpdateService {
	constructor(
		private readonly boardNodeRepo: BoardNodeRepo,
		private readonly metaTagExtractorAdapterService: MetaTagExtractorAdapterService
	) {}

	async updateContent(element: AnyContentElement, content: AnyElementContentBody): Promise<void> {
		// TODO refactor if ... else to e.g. discriminated union or non-exhaustive check
		if (isFileElement(element) && content instanceof FileContentBody) {
			this.updateFileElement(element, content);
		} else if (isLinkElement(element) && content instanceof LinkContentBody) {
			await this.updateLinkElement(element, content);
		} else if (isRichTextElement(element) && content instanceof RichTextContentBody) {
			this.updateRichTextElement(element, content);
		} else if (isDrawingElement(element) && content instanceof DrawingContentBody) {
			this.updateDrawingElement(element, content);
		} else if (isSubmissionContainerElement(element) && content instanceof SubmissionContainerContentBody) {
			this.updateSubmissionContainerElement(element, content);
		} else if (isExternalToolElement(element) && content instanceof ExternalToolContentBody) {
			this.updateExternalToolElement(element, content);
		} else {
			throw new Error(`Cannot update element of type: '${element.constructor.name}'`);
		}

		await this.boardNodeRepo.save(element);
	}

	updateFileElement(element: FileElement, content: FileContentBody): void {
		element.caption = sanitizeRichText(content.caption, InputFormat.PLAIN_TEXT);
		element.alternativeText = sanitizeRichText(content.alternativeText, InputFormat.PLAIN_TEXT);
	}

	async updateLinkElement(element: LinkElement, content: LinkContentBody): Promise<void> {
		const url = new URL(content.url);
		const metaData = await this.metaTagExtractorAdapterService.getMetaData(url);
		element.url = url.toString();
		element.title = metaData.title ?? '';
		element.description = metaData.description ?? '';
		element.originalImageUrl = metaData.originalImageUrl ?? '';
	}

	updateRichTextElement(element: RichTextElement, content: RichTextContentBody): void {
		element.text = sanitizeRichText(content.text, content.inputFormat);
		element.inputFormat = content.inputFormat;
	}

	updateDrawingElement(element: DrawingElement, content: DrawingContentBody): void {
		element.description = content.description;
	}

	updateSubmissionContainerElement(element: SubmissionContainerElement, content: SubmissionContainerContentBody): void {
		if (content.dueDate !== undefined) {
			element.dueDate = content.dueDate;
		}
	}

	updateExternalToolElement(element: ExternalToolElement, content: ExternalToolContentBody): void {
		if (content.contextExternalToolId !== undefined) {
			// Updates should not remove an existing reference to a tool, to prevent orphan tool instances
			element.contextExternalToolId = content.contextExternalToolId;
		}
	}
}

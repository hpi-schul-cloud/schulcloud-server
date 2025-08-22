import { Injectable } from '@nestjs/common';
import { sanitizeRichText } from '@shared/controller/transformer';
import { InputFormat } from '@shared/domain/types';
import { Ollama } from 'ollama'; // Assuming ollama is imported from a client module
import {
	type AnyElementContentBody,
	DrawingContentBody,
	ExternalToolContentBody,
	FileContentBody,
	FileFolderContentBody,
	H5pContentBody,
	LinkContentBody,
	RichTextContentBody,
	SubmissionContainerContentBody,
	VideoConferenceContentBody,
} from '../../controller/dto';
import type {
	AnyContentElement,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	FileFolderElement,
	LinkElement,
	RichTextElement,
	SubmissionContainerElement,
	VideoConferenceElement,
} from '../../domain';
import {
	H5pElement,
	isDrawingElement,
	isExternalToolElement,
	isFileElement,
	isFileFolderElement,
	isH5pElement,
	isLinkElement,
	isRichTextElement,
	isSubmissionContainerElement,
	isVideoConferenceElement,
} from '../../domain';
import { BoardNodeRepo } from '../../repo';

@Injectable()
export class ContentElementUpdateService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	public async updateContent(element: AnyContentElement, content: AnyElementContentBody): Promise<void> {
		// TODO refactor if ... else to e.g. discriminated union or non-exhaustive check
		if (isFileElement(element) && content instanceof FileContentBody) {
			this.updateFileElement(element, content);
		} else if (isLinkElement(element) && content instanceof LinkContentBody) {
			this.updateLinkElement(element, content);
		} else if (isRichTextElement(element) && content instanceof RichTextContentBody) {
			await this.updateRichTextElement(element, content);
		} else if (isDrawingElement(element) && content instanceof DrawingContentBody) {
			this.updateDrawingElement(element, content);
		} else if (isSubmissionContainerElement(element) && content instanceof SubmissionContainerContentBody) {
			this.updateSubmissionContainerElement(element, content);
		} else if (isExternalToolElement(element) && content instanceof ExternalToolContentBody) {
			this.updateExternalToolElement(element, content);
		} else if (isVideoConferenceElement(element) && content instanceof VideoConferenceContentBody) {
			this.updateVideoConferenceElement(element, content);
		} else if (isFileFolderElement(element) && content instanceof FileFolderContentBody) {
			this.updateFileFolderElement(element, content);
		} else if (isH5pElement(element) && content instanceof H5pContentBody) {
			this.updateH5pElement(element, content);
		} else {
			throw new Error(`Cannot update element of type: '${element.constructor.name}'`);
		}

		await this.boardNodeRepo.save(element);
	}

	public updateFileElement(element: FileElement, content: FileContentBody): void {
		element.caption = sanitizeRichText(content.caption, InputFormat.PLAIN_TEXT);
		element.alternativeText = sanitizeRichText(content.alternativeText, InputFormat.PLAIN_TEXT);
	}

	public updateLinkElement(element: LinkElement, content: LinkContentBody): void {
		element.url = new URL(content.url).toString();
		element.title = content.title ?? '';
		element.description = content.description ?? '';
		if (content.imageUrl) {
			const isRelativeUrl = (url: string) => {
				const fallbackHostname = 'https://www.fallback-url-if-url-is-relative.org';
				const imageUrlObject = new URL(url, fallbackHostname);
				return imageUrlObject.origin === fallbackHostname;
			};

			if (isRelativeUrl(content.imageUrl)) {
				element.imageUrl = content.imageUrl;
			}
		}
	}

	public async updateRichTextElement(element: RichTextElement, content: RichTextContentBody): Promise<void> {
		const ollama = new Ollama();
		console.log('text', content.text);
		const embeddingText = sanitizeRichText(content.text, InputFormat.PLAIN_TEXT);
		console.log('Embedding text:', embeddingText);
		const embedding = await ollama.embed({
			model: 'mxbai-embed-large',
			input: embeddingText,
		});

		console.log('Embedding generated:', embedding);

		element.text = sanitizeRichText(content.text, content.inputFormat);
		element.inputFormat = content.inputFormat;
		element.embedding = embedding.embeddings;
	}

	public updateDrawingElement(element: DrawingElement, content: DrawingContentBody): void {
		element.description = content.description;
	}

	public updateSubmissionContainerElement(
		element: SubmissionContainerElement,
		content: SubmissionContainerContentBody
	): void {
		if (content.dueDate !== undefined) {
			element.dueDate = content.dueDate;
		}
	}

	public updateExternalToolElement(element: ExternalToolElement, content: ExternalToolContentBody): void {
		if (content.contextExternalToolId !== undefined && element.contextExternalToolId === undefined) {
			// Updates should not remove an existing reference to a tool, to prevent orphan tool instances
			element.contextExternalToolId = content.contextExternalToolId;
		}
	}

	public updateVideoConferenceElement(element: VideoConferenceElement, content: VideoConferenceContentBody): void {
		element.title = content.title;
	}

	public updateFileFolderElement(element: FileFolderElement, content: FileFolderContentBody): void {
		element.title = content.title;
	}

	public updateH5pElement(element: H5pElement, content: H5pContentBody): void {
		if (content.contentId !== undefined && element.contentId === undefined) {
			element.contentId = content.contentId;
		}
	}
}

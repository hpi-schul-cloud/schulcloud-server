import { NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { AnyBoardDo, FileElement, RichTextElement } from '@shared/domain/domainobject';
import {
	AnyContentElementResponse,
	FileElementResponse,
	RichTextElementResponse,
	isFileElementResponse,
	isRichTextElementResponse,
} from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
import { CollaborativeTextEditorElementResponseMapper } from './collaborative-text-editor-element-response.mapper';
import { DrawingElementResponseMapper } from './drawing-element-response.mapper';
import { ExternalToolElementResponseMapper } from './external-tool-element-response.mapper';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { LinkElementResponseMapper } from './link-element-response.mapper';
import { RichTextElementResponseMapper } from './rich-text-element-response.mapper';
import { SubmissionContainerElementResponseMapper } from './submission-container-element-response.mapper';

export class ContentElementResponseFactory {
	private static mappers: BaseResponseMapper[] = [
		FileElementResponseMapper.getInstance(),
		LinkElementResponseMapper.getInstance(),
		RichTextElementResponseMapper.getInstance(),
		DrawingElementResponseMapper.getInstance(),
		SubmissionContainerElementResponseMapper.getInstance(),
		ExternalToolElementResponseMapper.getInstance(),
		CollaborativeTextEditorElementResponseMapper.getInstance(),
	];

	static mapToResponse(element: AnyBoardDo): AnyContentElementResponse {
		const elementMapper = this.mappers.find((mapper) => mapper.canMap(element));

		if (!elementMapper) {
			throw new NotImplementedException(`unsupported element type: ${element.constructor.name}`);
		}

		const result = elementMapper.mapToResponse(element);

		return result;
	}

	static mapSubmissionContentToResponse(
		element: RichTextElement | FileElement
	): FileElementResponse | RichTextElementResponse {
		const result = this.mapToResponse(element);
		if (!isFileElementResponse(result) && !isRichTextElementResponse(result)) {
			throw new UnprocessableEntityException();
		}
		return result;
	}
}

import { NotImplementedException, UnprocessableEntityException } from '@nestjs/common';
import { AnyBoardDo, FileElement, RichTextElement } from '@shared/domain/domainobject';
import {
	AnyContentElementResponse,
	FileElementResponse,
	isFileElementResponse,
	isRichTextElementResponse,
	RichTextElementResponse,
} from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
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
		SubmissionContainerElementResponseMapper.getInstance(),
		ExternalToolElementResponseMapper.getInstance(),
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

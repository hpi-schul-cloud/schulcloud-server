import { NotImplementedException } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain';
import { AnyContentElementResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
import { ExternalToolElementResponseMapper } from './external-tool-element-response.mapper';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { RichTextElementResponseMapper } from './rich-text-element-response.mapper';
import { SubmissionContainerElementResponseMapper } from './submission-container-element-response.mapper';

export class ContentElementResponseFactory {
	private static mappers: BaseResponseMapper[] = [
		FileElementResponseMapper.getInstance(),
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
}

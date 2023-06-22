import { NotImplementedException } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain';
import { AnyContentElementResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { RichTextElementResponseMapper } from './rich-text-element-response.mapper';
import { SubmissionContentElementResponseMapper } from './task-element-response.mapper';

export class ContentElementResponseFactory {
	private static mappers: BaseResponseMapper[] = [
		FileElementResponseMapper.getInstance(),
		RichTextElementResponseMapper.getInstance(),
		SubmissionContentElementResponseMapper.getInstance(),
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

import { NotImplementedException } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain';
import { AnyContentElementResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { TextElementResponseMapper } from './text-element-response.mapper';

export class ContentElementResponseBuilder {
	private static mappers: BaseResponseMapper[] = [
		TextElementResponseMapper.getInstance(),
		FileElementResponseMapper.getInstance(),
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

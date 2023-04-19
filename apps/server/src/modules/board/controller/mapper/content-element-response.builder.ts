import { NotImplementedException } from '@nestjs/common';
import { AnyBoardDo } from '@shared/domain';
import { AnyContentElementResponse } from '../dto';
import { BaseResponseMapper } from './base-mapper.interface';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { TextElementResponseMapper } from './text-element-response.mapper';

export class ContentElementResponseBuilder {
	private static mappers = new Set<BaseResponseMapper>([
		TextElementResponseMapper.getInstance(),
		FileElementResponseMapper.getInstance(),
	]);

	static mapToResponse(element: AnyBoardDo): AnyContentElementResponse {
		let mapper: BaseResponseMapper<AnyBoardDo> | undefined;
		ContentElementResponseBuilder.mappers.forEach((map) => {
			if (map.canMap(element)) mapper = map;
		});

		if (!mapper) {
			throw new NotImplementedException(`unsupported element type: ${element.constructor.name}`);
		}

		const result = mapper.mapToResponse(element);

		return result;
	}
}

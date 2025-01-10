import { NotImplementedException } from '@nestjs/common';
import { AnyMediaElement } from '../../../domain';
import { DeletedElementResponseMapper } from '../../mapper';
import { BaseResponseMapper } from '../../mapper/base-mapper.interface';
import { AnyMediaElementResponse } from '../dto';
import { MediaExternalToolElementResponseMapper } from './media-external-tool-element-response.mapper';

export class AnyMediaElementResponseFactory {
	private static mappers: BaseResponseMapper<AnyMediaElement, AnyMediaElementResponse>[] = [
		DeletedElementResponseMapper.getInstance(),
		MediaExternalToolElementResponseMapper.getInstance(),
	];

	static mapToResponse(elements: AnyMediaElement[]): AnyMediaElementResponse[] {
		const mapped: AnyMediaElementResponse[] = elements.map((element) => {
			const elementMapper = this.mappers.find((mapper) => mapper.canMap(element));

			if (!elementMapper) {
				throw new NotImplementedException(`unsupported element type: ${element.constructor.name}`);
			}

			const result = elementMapper.mapToResponse(element);

			return result;
		});

		return mapped;
	}
}

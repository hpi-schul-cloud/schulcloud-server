import { AnyMediaElement, isMediaExternalToolElement } from '../../../domain';
import { DeletedElementResponseMapper } from '../../mapper';
import { AnyMediaElementResponse } from '../dto';
import { MediaExternalToolElementResponseMapper } from './media-external-tool-element-response.mapper';

export class AnyMediaElementResponseFactory {
	static mapToResponse(elements: AnyMediaElement[]): AnyMediaElementResponse[] {
		const mapped: AnyMediaElementResponse[] = elements.map((element) => {
			if (isMediaExternalToolElement(element)) {
				return MediaExternalToolElementResponseMapper.getInstance().mapToResponse(element);
			}
			return DeletedElementResponseMapper.getInstance().mapToResponse(element);
		});

		return mapped;
	}
}

import { AnyBoardDo, FileElement, TextElement } from '@shared/domain';
import { AnyContentElementResponse } from '../dto';
import { FileElementResponseMapper } from './file-element-response.mapper';
import { TextElementResponseMapper } from './text-element-response.mapper';

export class ElementsResponseMapper {
	static mapToResponse(element: AnyBoardDo): AnyContentElementResponse {
		if (element instanceof TextElement) {
			return TextElementResponseMapper.mapToResponse(element);
		}
		if (element instanceof FileElement) {
			return FileElementResponseMapper.mapToResponse(element);
		}
		throw new Error(`unsupported child type: ${element.constructor.name}`);
	}
}
